/**
 * Script para verificar todas las conexiones a base de datos del sistema
 * Ejecutar con: node scripts/verify-all-connections.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Importar los modelos para probar
const { sequelize: getSequelize } = require('../config/database');
const { pool, getConnection, query } = require('../config/dbPool');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'websap',
  port: process.env.DB_PORT || 3306
};

/**
 * Verifica la conexión directa a MySQL
 */
async function testDirectConnection() {
  console.log('\n🔍 [TEST 1] - Probando conexión directa con MySQL...');
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    const [rows] = await connection.query('SELECT 1+1 as result');
    console.log(`✅ [TEST 1] - Conexión directa exitosa: ${rows[0].result}`);
    await connection.end();
    return true;
  } catch (error) {
    console.error(`❌ [TEST 1] - Error en conexión directa: ${error.message}`);
    return false;
  }
}

/**
 * Verifica la conexión mediante el Pool de MySQL
 */
async function testPoolConnection() {
  console.log('\n🔍 [TEST 2] - Probando conexión a través del Pool...');
  
  try {
    const results = await query('SELECT 1+1 as result');
    console.log(`✅ [TEST 2] - Conexión mediante Pool exitosa: ${results[0].result}`);
    return true;
  } catch (error) {
    console.error(`❌ [TEST 2] - Error en conexión mediante Pool: ${error.message}`);
    return false;
  }
}

/**
 * Verifica la conexión mediante Sequelize
 */
async function testSequelizeInstance() {
  console.log('\n🔍 [TEST 3] - Probando instancia Sequelize de configuración...');
  
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log(`✅ [TEST 3] - Sequelize de configuración conectado: ${results[0].result}`);
    return true;
  } catch (error) {
    console.error(`❌ [TEST 3] - Error en conexión Sequelize de configuración: ${error.message}`);
    return false;
  }
}

/**
 * Verifica la conexión de los modelos de la aplicación
 */
async function testModelsConnection() {
  console.log('\n🔍 [TEST 4] - Probando conexión de modelos...');
  
  try {
    // Usar una conexión a nivel de módulo para evitar conflictos
    // Usamos path para un require con ruta exacta
    const path = require('path');
    const modelPath = path.join(__dirname, '..', 'models', 'index.js');
    
    // Limpiar la caché de require para evitar conflictos
    delete require.cache[require.resolve(modelPath)];
    
    // Importar el módulo de modelos
    const models = require(modelPath);
    
    // Probar la conectividad con la instancia de sequelize
    if (!models.sequelize) {
      throw new Error('La instancia de Sequelize no está disponible en los modelos');
    }
    
    const [results] = await models.sequelize.query('SELECT 1+1 as result');
    console.log(`✅ [TEST 4] - Conexión de modelos exitosa: ${results[0].result}`);
    
    // Intentar hacer una consulta simple usando un modelo
    try {
      if (models.Usuario) {
        const count = await models.Usuario.count();
        console.log(`✅ [TEST 4.1] - Consulta de modelo exitosa: ${count} usuarios en la base de datos`);
      } else {
        console.log(`⚠️ [TEST 4.1] - Modelo Usuario no encontrado en los modelos exportados`);
      }
    } catch (modelError) {
      console.error(`⚠️ [TEST 4.1] - Error en consulta de modelo: ${modelError.message}`);
      // No consideramos esto como un error fatal
    }
    
    return true;
  } catch (error) {
    console.error(`❌ [TEST 4] - Error en conexión de modelos: ${error.message}`);
    return false;
  }
}

/**
 * Ejecuta todos los tests y muestra un resumen
 */
async function runAllTests() {
  console.log('🔄 Iniciando verificación completa de conexiones a base de datos...');
  console.log(`📋 Configuración: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  
  // Ejecutar todas las pruebas
  const test1 = await testDirectConnection();
  const test2 = await testPoolConnection();
  const test3 = await testSequelizeInstance();
  const test4 = await testModelsConnection();
  
  // Mostrar resumen
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log(`Test 1 - Conexión MySQL directa:    ${test1 ? '✅ OK' : '❌ Error'}`);
  console.log(`Test 2 - Conexión Pool MySQL:       ${test2 ? '✅ OK' : '❌ Error'}`);
  console.log(`Test 3 - Instancia Sequelize:       ${test3 ? '✅ OK' : '❌ Error'}`);
  console.log(`Test 4 - Conexión modelos:          ${test4 ? '✅ OK' : '❌ Error'}`);
  
  const allPassed = test1 && test2 && test3 && test4;
  
  console.log(`\n${allPassed ? '✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE!' : '⚠️ ALGUNAS PRUEBAS FALLARON'}`);
  
  if (!allPassed) {
    console.log('\n🔧 RECOMENDACIONES:');
    
    if (!test1) {
      console.log('- Verificar que el servidor MySQL esté en ejecución.');
      console.log('- Comprobar las credenciales de acceso.');
    }
    
    if (test1 && !test2) {
      console.log('- Revisar la configuración del Pool en config/dbPool.js');
      console.log('- Verificar límites de conexiones.');
    }
    
    if (test1 && !test3) {
      console.log('- Revisar la configuración de Sequelize en config/database.js');
      console.log('- Comprobar que getSequelize() devuelve una instancia válida.');
    }
    
    if (test3 && !test4) {
      console.log('- Revisar index.js en la carpeta models');
      console.log('- Verificar que los modelos utilizan correctamente la instancia de Sequelize.');
    }
  }
  
  return allPassed;
}

// Ejecutar todas las pruebas
runAllTests().then(allPassed => {
  process.exit(allPassed ? 0 : 1);
});
