/**
 * Test específico para verificar el correcto funcionamiento del dbConnectionManager
 * Ejecutar con: node scripts/test-connection-manager.js
 */
require('dotenv').config();
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');

async function testDbConnectionManager() {
  try {
    console.log('🔄 Probando dbConnectionManager...');
    
    // Verificar conexión
    console.log('\n🔍 Verificando estado actual de la conexión...');
    const initialStatus = await checkDatabaseConnection();
    
    console.log('\n📋 Estado de conexión:', JSON.stringify(initialStatus, null, 2));
    
    // Si hay problemas, intentar reparar
    if (!initialStatus.success) {
      console.log('\n🔧 Intentando reparación automática...');
      
      const repairResult = await repairDatabaseConnection();
      console.log('\n📋 Resultado de reparación:', JSON.stringify(repairResult, null, 2));
      
      // Verificar estado después de la reparación
      const finalStatus = await checkDatabaseConnection();
      console.log('\n📋 Estado final después de reparación:', JSON.stringify(finalStatus, null, 2));
    }
    
    console.log('\n✅ Prueba de dbConnectionManager completada.');
    return true;
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    return false;
  }
}

// Ejecutar prueba
testDbConnectionManager()
  .then(success => process.exit(success ? 0 : 1));
