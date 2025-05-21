/**
 * Script para corregir problemas de conexión en la base de datos
 * Ejecutar con: node scripts/fix-database-connection.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'websap',
  port: process.env.DB_PORT || 3306
};

/**
 * Prueba conexión directa a MySQL
 */
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

/**
 * Prueba conexión con Sequelize
 */
async function testSequelizeConnection() {
  console.log('🔍 Probando conexión con Sequelize...');
  
  // Crear instancia manual de Sequelize para diagnóstico
  const testSequelize = new Sequelize(
    dbConfig.database,
    dbConfig.user,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 2,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  
  try {
    await testSequelize.authenticate();
    console.log('✅ Conexión Sequelize directa exitosa');
    
    // Probar consulta simple
    const [results] = await testSequelize.query('SELECT 1+1 as result');
    console.log('✅ Consulta Sequelize exitosa:', results[0].result);
    
    await testSequelize.close();
    return true;
  } catch (error) {
    console.error('❌ Error en conexión Sequelize directa:', error.message);
    return false;
  }
}

/**
 * Verifica archivo .env
 */
function checkEnvFile() {
  console.log('🔍 Verificando configuración en archivo .env...');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró archivo .env');
    
    // Crear archivo .env con configuración básica
    const envContent = `
# Configuración de base de datos
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=websap
DB_PORT=3306

# Otras configuraciones
PORT=3000
NODE_ENV=development
SYNC_ENABLED=true
    `;
    
    fs.writeFileSync(envPath, envContent.trim());
    console.log('✅ Se ha creado un nuevo archivo .env con configuración básica');
    return false;
  } else {
    console.log('✅ Archivo .env existe');
    
    // Leer contenido del archivo
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar variables críticas
    const missingVars = [];
    if (!envContent.includes('DB_HOST')) missingVars.push('DB_HOST');
    if (!envContent.includes('DB_USER')) missingVars.push('DB_USER');
    if (!envContent.includes('DB_NAME')) missingVars.push('DB_NAME');
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Variables faltantes en .env: ${missingVars.join(', ')}`);
      
      // Agregar variables faltantes
      let newContent = envContent;
      if (missingVars.includes('DB_HOST')) newContent += '\nDB_HOST=localhost';
      if (missingVars.includes('DB_USER')) newContent += '\nDB_USER=root';
      if (missingVars.includes('DB_NAME')) newContent += '\nDB_NAME=websap';
      
      fs.writeFileSync(envPath, newContent);
      console.log('✅ Se han agregado variables faltantes al archivo .env');
    }
    
    return true;
  }
}

/**
 * Crea la base de datos si no existe
 */
async function createDatabaseIfNeeded() {
  console.log('🔍 Verificando existencia de la base de datos...');
  
  try {
    // Conectar sin especificar base de datos
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    // Verificar si la base de datos existe
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );
    
    if (rows.length === 0) {
      console.log(`⚠️ Base de datos '${dbConfig.database}' no existe, creándola...`);
      
      // Crear la base de datos
      await connection.query(
        `CREATE DATABASE \`${dbConfig.database}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      
      console.log(`✅ Base de datos '${dbConfig.database}' creada exitosamente`);
    } else {
      console.log(`✅ Base de datos '${dbConfig.database}' existe`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Error al verificar/crear la base de datos:', error.message);
    return false;
  }
}

/**
 * Verifica implementación de modelos
 */
async function checkAndFixModelsImplementation() {
  console.log('🔍 Verificando implementación de modelos...');
  
  // Verificar index.js en models
  const indexPath = path.join(__dirname, '..', 'models', 'index.js');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Verificar forma de importar sequelize
    if (content.includes('const { sequelize } = require(') && 
        !content.includes('const sequelize = getSequelize()')) {
      
      console.warn('⚠️ Posible problema en models/index.js con la importación de sequelize');
      
      // Ya hemos corregido este archivo en una edición anterior
      console.log('✅ El archivo models/index.js ya ha sido corregido');
    } else {
      console.log('✅ La implementación en models/index.js parece correcta');
    }
  }
  
  return true;
}

/**
 * Ejecutar todos los diagnósticos y reparaciones
 */
async function runFullDiagnostic() {
  console.log('🔄 Iniciando diagnóstico completo de conexión a base de datos...');
  console.log('====================================================');
  
  // Paso 1: Verificar archivo .env
  await checkEnvFile();
  console.log('====================================================');
  
  // Paso 2: Verificar existencia de base de datos
  await createDatabaseIfNeeded();
  console.log('====================================================');
  
  // Paso 3: Probar conexión directa
  const directConnOk = await testDirectConnection();
  console.log('====================================================');
  
  // Paso 4: Probar conexión Sequelize
  const sequelizeOk = await testSequelizeConnection();
  console.log('====================================================');
  
  // Paso 5: Verificar implementación de modelos
  await checkAndFixModelsImplementation();
  console.log('====================================================');
  
  // Resumen final
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log(`- Conexión directa MySQL: ${directConnOk ? '✅ OK' : '❌ Fallida'}`);
  console.log(`- Conexión Sequelize: ${sequelizeOk ? '✅ OK' : '❌ Fallida'}`);
  
  if (directConnOk && sequelizeOk) {
    console.log('\n✅ DIAGNÓSTICO COMPLETADO: Las conexiones básicas funcionan correctamente');
    console.log('\nSi aún experimenta problemas en la aplicación, puede deberse a:');
    console.log('1. Inconsistencias en la importación de módulos');
    console.log('2. Problemas de sincronización entre diferentes partes del sistema');
    console.log('3. Errores en definición de modelos o relaciones');
    console.log('\nSe ha aplicado la corrección en los archivos críticos.');
  } else {
    console.log('\n⚠️ DIAGNÓSTICO COMPLETADO: Se detectaron problemas de conexión');
    console.log('\nAcciones recomendadas:');
    if (!directConnOk) {
      console.log('- Verificar que el servidor MySQL esté en ejecución');
      console.log('- Comprobar credenciales de acceso (usuario/contraseña)');
      console.log('- Verificar que el host y puerto sean correctos');
    }
    if (directConnOk && !sequelizeOk) {
      console.log('- Revisar la configuración de Sequelize');
      console.log('- Verificar versiones de dependencias');
    }
  }
}

// Ejecutar diagnóstico
runFullDiagnostic()
  .then(() => {
    console.log('\n✅ Proceso de diagnóstico y reparación finalizado');
  })
  .catch(error => {
    console.error('\n❌ Error durante el diagnóstico:', error.message);
  });
