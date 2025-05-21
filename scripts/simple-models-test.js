/**
 * Script simple para verificar que los modelos y la conexión funcionan
 */
require('dotenv').config();

async function testModels() {
  try {
    console.log('🔍 Cargando modelos...');
    
    // Cargar modelos
    const models = require('../models');
    
    console.log('✅ Modelos cargados correctamente');
    console.log('📋 Módulos exportados:', Object.keys(models).join(', '));
    
    // Probar consulta con Sequelize
    console.log('\n🔍 Probando conexión a base de datos...');
    const [results] = await models.sequelize.query('SELECT 1+1 as result');
    console.log(`✅ Conexión exitosa, resultado: ${results[0].result}`);
    
    // Probar modelo Usuario
    if (models.Usuario) {
      console.log('\n🔍 Probando modelo Usuario...');
      const count = await models.Usuario.count();
      console.log(`✅ Consulta exitosa: ${count} usuarios encontrados`);
    }
    
    console.log('\n✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
    return true;
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    return false;
  }
}

testModels()
  .then(success => {
    console.log(`\n📋 Resultado final: ${success ? 'ÉXITO' : 'FALLO'}`);
    process.exit(success ? 0 : 1);
  });
