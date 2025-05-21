/**
 * Script maestro para ejecutar todos los diagnósticos del sistema
 * Ejecutar desde la línea de comandos: node scripts/run-diagnostics.js
 */
require('dotenv').config();
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Muestra un mensaje con color en la consola
 */
function colorLog(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Muestra un título formateado en la consola
 */
function printTitle(title) {
  console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + ' ' + title + colors.reset);
  console.log(colors.cyan + '='.repeat(60) + colors.reset);
}

/**
 * Muestra un subtítulo formateado en la consola
 */
function printSubtitle(subtitle) {
  console.log('\n' + colors.yellow + subtitle + colors.reset);
  console.log(colors.yellow + '-'.repeat(subtitle.length) + colors.reset);
}

/**
 * Verifica la estructura del proyecto
 */
async function checkProjectStructure() {
  printSubtitle('Verificando estructura del proyecto');
  
  // Directorios que deberían existir
  const requiredDirs = [
    '../routes',
    '../controllers',
    '../models',
    '../config',
    '../middleware'
  ];
  
  // Archivos críticos que deberían existir
  const requiredFiles = [
    '../app.js',
    '../config/dbPool.js',
    '../config/database.js',
    '../routes/adminRoutes.js',
    '../routes/userRoutes.js',
    '../routes/systemStatusRoutes.js'
  ];
  
  // Verificar directorios
  let allDirsExist = true;
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    const exists = fs.existsSync(dirPath);
    console.log(`${exists ? '✅' : '❌'} Directorio ${dir}: ${exists ? 'Existe' : 'No existe'}`);
    if (!exists) allDirsExist = false;
  }
  
  // Verificar archivos
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} Archivo ${file}: ${exists ? 'Existe' : 'No existe'}`);
    if (!exists) allFilesExist = false;
  }
  
  return { directorios: allDirsExist, archivos: allFilesExist };
}

/**
 * Verifica la configuración del entorno
 */
async function checkEnvironmentConfig() {
  printSubtitle('Verificando configuración del entorno');
  
  const envPath = path.join(__dirname, '..', '.env');
  let envExists = fs.existsSync(envPath);
  
  console.log(`${envExists ? '✅' : '⚠️'} Archivo .env: ${envExists ? 'Existe' : 'No existe'}`);
  
  // Si no existe, buscamos un archivo de ejemplo
  if (!envExists) {
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    const envExampleExists = fs.existsSync(envExamplePath);
    
    if (envExampleExists) {
      console.log('ℹ️ Encontrado archivo .env.example, se puede usar como base');
      // Aquí podríamos crear automáticamente el .env a partir del .env.example
    } else {
      console.log('❌ No se encontró ningún archivo de configuración de entorno');
    }
  }
  
  // Si existe, verificar variables críticas
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim();
      }
    });
    
    // Variables críticas que deberían estar definidas
    const criticalVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'PORT'];
    
    for (const varName of criticalVars) {
      const isDefined = envVars[varName] !== undefined;
      console.log(`${isDefined ? '✅' : '❌'} Variable ${varName}: ${isDefined ? 'Definida' : 'No definida'}`);
    }
    
    // Verificar configuración de sincronización
    const syncEnabled = envVars.SYNC_ENABLED === 'true';
    console.log(`ℹ️ Sincronización: ${syncEnabled ? 'Activada' : 'Desactivada'}`);
    
    return {
      exists: envExists,
      varsOk: criticalVars.every(varName => envVars[varName] !== undefined),
      syncEnabled
    };
  }
  
  return { exists: false, varsOk: false, syncEnabled: false };
}

/**
 * Verifica la conexión a la base de datos
 */
async function checkDatabaseConnectivity() {
  printSubtitle('Verificando conexión a la base de datos');
  
  // Usar nuestra utilidad para verificar la conexión
  const dbStatus = await checkDatabaseConnection();
  
  console.log(`${dbStatus.success ? '✅' : '❌'} Conexión a la base de datos: ${dbStatus.success ? 'OK' : 'Fallida'}`);
  console.log(`${dbStatus.sequelizeConnected ? '✅' : '❌'} Conexión Sequelize: ${dbStatus.sequelizeConnected ? 'OK' : 'Fallida'}`);
  console.log(`${dbStatus.poolConnected ? '✅' : '❌'} Pool de conexiones: ${dbStatus.poolConnected ? 'OK' : 'Fallida'}`);
  
  // Si hay problemas, intentar una prueba directa con MySQL
  if (!dbStatus.success) {
    try {
      console.log('\nIntentando conexión directa con MySQL...');
      
      // Extraer configuración del entorno
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'websap'
      };
      
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database
      });
      
      await connection.query('SELECT 1+1 as result');
      console.log('✅ Conexión directa exitosa');
      await connection.end();
      
      console.log('⚠️ La conexión directa funciona pero el sistema no puede conectarse');
      console.log('   Es posible que haya un problema en la configuración de Sequelize o el pool');
    } catch (error) {
      console.log(`❌ La conexión directa también falló: ${error.message}`);
      console.log('   El problema puede estar en las credenciales o el servidor de MySQL');
    }
  }
  
  return dbStatus;
}

/**
 * Verifica las rutas de la API y los controladores
 */
async function checkApiRoutes() {
  printSubtitle('Verificando rutas de la API');
  
  const routeStats = {
    total: 0,
    withControllers: 0,
    problematic: []
  };
  
  // Verificar archivos de rutas
  const routesDir = path.join(__dirname, '../routes');
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    routeStats.total = routeFiles.length;
    
    console.log(`ℹ️ Total de archivos de rutas encontrados: ${routeFiles.length}`);
    
    // Verificar cada archivo de rutas
    for (const file of routeFiles) {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar uso de controladores
      const hasController = content.includes('require(\'../controllers/') || 
                           content.includes('require("../controllers/');
      
      if (hasController) {
        routeStats.withControllers++;
      } else {
        routeStats.problematic.push(file);
        console.log(`⚠️ Archivo de rutas ${file} no parece usar controladores`);
      }
    }
    
    console.log(`✅ ${routeStats.withControllers} de ${routeStats.total} archivos de rutas usan controladores adecuadamente`);
    
    // Verificar específicamente adminRoutes.js y userRoutes.js
    const criticalRoutes = ['adminRoutes.js', 'userRoutes.js'];
    for (const routeFile of criticalRoutes) {
      const exists = routeFiles.includes(routeFile);
      console.log(`${exists ? '✅' : '❌'} Ruta crítica ${routeFile}: ${exists ? 'Existe' : 'No existe'}`);
    }
    
    return routeStats;
  } else {
    console.log('❌ No se encontró el directorio de rutas');
    return { total: 0, withControllers: 0, problematic: [] };
  }
}

/**
 * Verifica si hay modelos y migraciones de Sequelize
 */
async function checkSequelizeModels() {
  printSubtitle('Verificando modelos Sequelize');
  
  const modelsDir = path.join(__dirname, '../models');
  const migrationsDir = path.join(__dirname, '../migrations');
  
  const modelsExist = fs.existsSync(modelsDir);
  const migrationsExist = fs.existsSync(migrationsDir);
  
  console.log(`${modelsExist ? '✅' : '❌'} Directorio de modelos: ${modelsExist ? 'Existe' : 'No existe'}`);
  console.log(`${migrationsExist ? '✅' : '❌'} Directorio de migraciones: ${migrationsExist ? 'Existe' : 'No existe'}`);
  
  // Verificar modelos críticos
  if (modelsExist) {
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));
    console.log(`ℹ️ Total de archivos de modelo encontrados: ${modelFiles.length}`);
    
    const criticalModels = ['usuario.js', 'index.js'];
    for (const modelFile of criticalModels) {
      const exists = modelFiles.includes(modelFile);
      console.log(`${exists ? '✅' : '⚠️'} Modelo crítico ${modelFile}: ${exists ? 'Existe' : 'No existe'}`);
    }
  }
  
  return { 
    modelsExist, 
    migrationsExist 
  };
}

/**
 * Función principal para ejecutar todos los diagnósticos
 */
async function runAllDiagnostics() {
  printTitle('DIAGNÓSTICO COMPLETO DEL SISTEMA WEBSAP');
  colorLog(`Fecha: ${new Date().toISOString()}`, 'blue');
  colorLog(`Entorno: ${process.env.NODE_ENV || 'no definido'}`, 'blue');
  
  try {
    // Ejecutar todos los diagnósticos
    const structureResult = await checkProjectStructure();
    console.log('\n');
    
    const envResult = await checkEnvironmentConfig();
    console.log('\n');
    
    const dbResult = await checkDatabaseConnection();
    
    // Solo ejecutar estos si hay conexión a la DB
    let routesResult = null;
    let modelsResult = null;
    
    // Estos diagnósticos no dependen de la base de datos
    routesResult = await checkApiRoutes();
    console.log('\n');
    
    modelsResult = await checkSequelizeModels();
    console.log('\n');
    
    // Resumen general
    printTitle('RESUMEN DEL DIAGNÓSTICO');
    
    // Estructura del proyecto
    colorLog(`Estructura del proyecto: ${structureResult.directorios && structureResult.archivos ? '✅ OK' : '⚠️ Problemas'}`, 
      structureResult.directorios && structureResult.archivos ? 'green' : 'yellow');
      
    // Configuración de entorno
    colorLog(`Configuración de entorno: ${envResult.exists && envResult.varsOk ? '✅ OK' : '⚠️ Problemas'}`,
      envResult.exists && envResult.varsOk ? 'green' : 'yellow');
    
    // Conexión a la base de datos
    colorLog(`Conexión a la base de datos: ${dbResult.success ? '✅ OK' : '❌ Fallida'}`,
      dbResult.success ? 'green' : 'red');
    
    // Rutas de la API
    if (routesResult) {
      colorLog(`Rutas de la API: ${routesResult.problematic.length === 0 ? '✅ OK' : '⚠️ Con observaciones'}`,
        routesResult.problematic.length === 0 ? 'green' : 'yellow');
    }
    
    // Modelos Sequelize
    if (modelsResult) {
      colorLog(`Modelos Sequelize: ${modelsResult.modelsExist ? '✅ OK' : '⚠️ Problemas'}`,
        modelsResult.modelsExist ? 'green' : 'yellow');
    }
    
    // Sugerencias basadas en el diagnóstico
    printTitle('RECOMENDACIONES');
    
    if (!dbResult.success) {
      colorLog('1. Revisar la configuración de la base de datos en el archivo .env', 'yellow');
      colorLog('2. Verificar que el servidor MySQL esté en ejecución', 'yellow');
      colorLog('3. Ejecutar: node scripts/test-database-connection.js para más detalles', 'yellow');
      colorLog('4. Ejecutar: node scripts/fix-sync-config.js para corregir la configuración de sincronización', 'yellow');
    }
    
    if (!envResult.exists || !envResult.varsOk) {
      colorLog('5. Crear o revisar el archivo .env con todas las variables necesarias', 'yellow');
    }
    
    if (routesResult && routesResult.problematic.length > 0) {
      colorLog('6. Revisar los archivos de rutas problemáticos para asegurarse que usen controladores', 'yellow');
    }
    
    // Pasos recomendados para reparación
    if (!dbResult.success || !envResult.varsOk) {
      printTitle('PASOS PARA REPARACIÓN');
      colorLog('Ejecute los siguientes comandos para intentar reparar los problemas:', 'cyan');
      colorLog('1. node scripts/fix-sync-config.js', 'white');
      colorLog('2. node scripts/test-database-connection.js', 'white');
    }
    
  } catch (error) {
    console.error(`❌ Error durante el diagnóstico: ${error.message}`);
    console.error(error);
  }
}

// Ejecutar todos los diagnósticos
runAllDiagnostics().then(() => {
  console.log('\n✅ Diagnóstico completo');
}).catch((error) => {
  console.error('\n❌ Error en diagnóstico:', error);
});
