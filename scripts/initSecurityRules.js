// Script para inicializar las reglas de seguridad en la base de datos
const db = require('../models');
const securityConfig = require('../config/securityConfig');

async function initSecurityRules() {
  try {
    console.log('🔒 Inicializando reglas de seguridad...');
    
    // Verificar si la tabla existe
    if (!db.SecurityRule) {
      console.error('❌ Modelo SecurityRule no encontrado. Asegúrate de que el modelo esté correctamente definido.');
      return;
    }
    
    // Contar reglas existentes
    const existingRulesCount = await db.SecurityRule.count();
    console.log(`📊 Reglas existentes: ${existingRulesCount}`);
    
    // Si no hay reglas, cargar las predeterminadas
    if (existingRulesCount === 0) {
      console.log('🔄 Cargando reglas predeterminadas...');
      
      // Insertar reglas predeterminadas
      await db.SecurityRule.bulkCreate(securityConfig.defaultSecurityRules);
      
      const insertedCount = await db.SecurityRule.count();
      console.log(`✅ ${insertedCount} reglas de seguridad cargadas correctamente.`);
    } else {
      console.log('ℹ️ Ya existen reglas en la base de datos. No se cargarán las predeterminadas.');
      
      // Opcionalmente, actualizar reglas existentes
      // const rules = await db.SecurityRule.findAll();
      // console.log('Reglas actuales:', rules.map(r => r.name).join(', '));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar reglas de seguridad:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  initSecurityRules()
    .then(() => {
      console.log('✅ Inicialización de reglas de seguridad completada.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error durante la inicialización de reglas de seguridad:', error);
      process.exit(1);
    });
} else {
  // Exportar para uso en otros scripts
  module.exports = initSecurityRules;
}