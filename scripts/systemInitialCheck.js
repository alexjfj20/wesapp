/**
 * Verificaciones iniciales del sistema
 * Este script realiza comprobaciones del sistema al iniciar la aplicación
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');
const dbConnectionManager = require('../utils/dbConnectionManager');

/**
 * Verifica los directorios necesarios
 */
function checkRequiredDirectories() {
  console.log('📁 Verificando directorios necesarios...');
  
  const directories = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'logs')
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Creando directorio: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  console.log('✅ Directorios verificados correctamente');
  return true;
}

/**
 * Verifica los archivos de configuración
 */
function checkConfigFiles() {
  console.log('📄 Verificando archivos de configuración...');
  
  const requiredFiles = [
    { path: path.join(__dirname, '..', 'config', 'database.js'), required: true },
    { path: path.join(__dirname, '..', '.env'), required: false }
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      if (file.required) {
        console.error(`❌ Archivo requerido no encontrado: ${file.path}`);
        return false;
      } else {
        console.warn(`⚠️ Archivo opcional no encontrado: ${file.path}`);
      }
    }
  }
  
  console.log('✅ Archivos de configuración verificados');
  return true;
}

/**
 * Verifica la conexión a la base de datos
 */
async function checkDatabaseConnection() {
  console.log('🔌 Verificando conexión a la base de datos...');
  
  try {
    const result = await dbConnectionManager.checkConnection();
    
    if (result.success) {
      console.log('✅ Conexión a la base de datos establecida correctamente');
      return true;
    } else {
      console.error(`❌ Error al conectar con la base de datos: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar la conexión a la base de datos:', error);
    return false;
  }
}

/**
 * Ejecuta todas las verificaciones del sistema
 */
async function runSystemChecks() {
  console.log('🚀 Iniciando verificaciones del sistema...');
  
  // Verificar directorios
  const directoriesOk = checkRequiredDirectories();
  
  // Verificar archivos de configuración
  const configFilesOk = checkConfigFiles();
  
  // Verificar conexión a la base de datos
  const dbConnectionOk = await checkDatabaseConnection();
  
  // Resultado final
  const allChecksOk = directoriesOk && configFilesOk && dbConnectionOk;
  
  if (allChecksOk) {
    console.log('✅ Todas las verificaciones del sistema completadas con éxito');
  } else {
    console.warn('⚠️ Algunas verificaciones del sistema fallaron');
  }
  
  return {
    success: allChecksOk,
    directoriesOk,
    configFilesOk,
    dbConnectionOk
  };
}

module.exports = runSystemChecks;
