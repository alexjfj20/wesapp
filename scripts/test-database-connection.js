/**
 * Script para probar y diagnosticar la conexión a la base de datos
 * Ejecutar con: node scripts/test-database-connection.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'websap',
  port: process.env.DB_PORT || 3306
};

async function testDirectConnection() {
  console.log('🔍 Probando conexión directa con MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    const [rows] = await connection.query('SELECT 1+1 as result');
    console.log('✅ Conexión directa exitosa:', rows[0].result);
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Error en conexión directa:', error.message);
    return false;
  }
}

async function testSequelizeConnection() {
  console.log('🔍 Probando conexión con Sequelize...');
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.user,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false
    }
  );
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión Sequelize exitosa');
    await sequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Error en conexión Sequelize:', error.message);
    return false;
  }
}

async function diagnosticTest() {
  console.log('🔄 Iniciando diagnóstico de conexión a base de datos...');
  console.log('📊 Configuración:');
  console.log(` - Host: ${dbConfig.host}`);
  console.log(` - Puerto: ${dbConfig.port}`);
  console.log(` - Usuario: ${dbConfig.user}`);
  console.log(` - Base de datos: ${dbConfig.database}`);
  
  // Probar conexiones
  const directOk = await testDirectConnection();
  const sequelizeOk = await testSequelizeConnection();
  
  // Verificar conexiones del sistema
  console.log('\n🔍 Verificando conexiones del sistema...');
  const systemStatus = await checkDatabaseConnection();
  console.log('📊 Estado de conexiones del sistema:', JSON.stringify(systemStatus, null, 2));
  
  // Si hay problemas, intentar reparar
  if (!systemStatus.success) {
    console.log('\n🔧 Intentando reparar conexiones...');
    const repairResult = await repairDatabaseConnection();
    console.log('📊 Resultado de la reparación:', JSON.stringify(repairResult, null, 2));
    
    // Verificar estado final
    console.log('\n🔍 Verificando estado final...');
    const finalStatus = await checkDatabaseConnection();
    console.log('📊 Estado final:', JSON.stringify(finalStatus, null, 2));
  }
  
  // Resumen
  console.log('\n📝 Resumen de diagnóstico:');
  console.log(` - Conexión directa: ${directOk ? '✅ OK' : '❌ Fallo'}`);
  console.log(` - Conexión Sequelize: ${sequelizeOk ? '✅ OK' : '❌ Fallo'}`);
  console.log(` - Conexión del sistema: ${systemStatus.success ? '✅ OK' : '❌ Fallo'}`);
  
  if (!directOk) {
    console.log('\n❗ RECOMENDACIONES:');
    console.log(' - Verificar que el servidor MySQL esté en ejecución');
    console.log(' - Comprobar que las credenciales en el archivo .env sean correctas');
    console.log(' - Asegurarse que el usuario tenga permisos para acceder a la base de datos');
    console.log(' - Verificar que la base de datos exista');
  }
}

// Ejecutar diagnóstico
diagnosticTest()
  .then(() => {
    console.log('\n✅ Diagnóstico finalizado');
  })
  .catch(error => {
    console.error('\n❌ Error en diagnóstico:', error);
  });
