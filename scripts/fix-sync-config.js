/**
 * Script para verificar y reparar problemas de sincronización
 * Ejecutar con: node scripts/fix-sync-config.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');

// Configuración de sincronización
const SYNC_CONFIG = {
  default: {
    enabled: true,
    interval: 30000, // 30 segundos
    maxRetries: 3,
    timeout: 10000, // 10 segundos
  }
};

/**
 * Verifica si existe el archivo .env
 * @returns {boolean} true si existe, false si no
 */
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    return fs.existsSync(envPath);
  } catch (error) {
    console.error('❌ Error al verificar archivo .env:', error.message);
    return false;
  }
}

/**
 * Lee la configuración desde el archivo .env
 * @returns {Object} configuración actual o null si hay error
 */
function readEnvConfig() {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const config = {};
    
    // Parsear variables de entorno
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        config[key.trim()] = value.trim();
      }
    });
    
    return config;
  } catch (error) {
    console.error('❌ Error al leer archivo .env:', error.message);
    return null;
  }
}

/**
 * Guarda la configuración en el archivo .env
 * @param {Object} config configuración a guardar
 * @returns {boolean} true si se guardó correctamente, false si no
 */
function saveEnvConfig(config) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    return true;
  } catch (error) {
    console.error('❌ Error al guardar archivo .env:', error.message);
    return false;
  }
}

/**
 * Función principal para verificar y corregir la configuración de sincronización
 */
async function fixSyncConfig() {
  console.log('🔄 Iniciando verificación de configuración de sincronización...');
  
  // Verificar archivo .env
  const envExists = checkEnvFile();
  if (!envExists) {
    console.log('⚠️ No se encontró archivo .env, creando uno nuevo...');
    // Crear archivo .env con configuración por defecto
    const defaultConfig = {
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASS: '',
      DB_NAME: 'websap',
      DB_PORT: '3306',
      SYNC_ENABLED: 'true',
      SYNC_INTERVAL: '30000',
      SYNC_MAX_RETRIES: '3',
      SYNC_TIMEOUT: '10000'
    };
    saveEnvConfig(defaultConfig);
    console.log('✅ Archivo .env creado con configuración predeterminada');
  } else {
    console.log('✅ Archivo .env encontrado');
  }
  
  // Leer configuración actual
  const currentConfig = readEnvConfig() || {};
  console.log('📊 Configuración actual:', JSON.stringify({
    DB_HOST: currentConfig.DB_HOST,
    DB_NAME: currentConfig.DB_NAME,
    SYNC_ENABLED: currentConfig.SYNC_ENABLED
  }, null, 2));
  
  // Verificar variables de sincronización
  const syncEnabled = currentConfig.SYNC_ENABLED === 'true';
  console.log(`📊 Sincronización ${syncEnabled ? 'activada' : 'desactivada'}`);
  
  // Verificar conexión a la base de datos
  console.log('\n🔍 Verificando conexión a la base de datos...');
  const dbStatus = await checkDatabaseConnection();
  
  if (!dbStatus.success) {
    console.log('⚠️ Problemas en la conexión a la base de datos, intentando reparar...');
    await repairDatabaseConnection();
    
    // Volver a verificar
    const repairStatus = await checkDatabaseConnection();
    if (!repairStatus.success) {
      console.log('❌ No se pudo reparar la conexión a la base de datos');
      console.log('⚠️ Se desactivará la sincronización para evitar errores');
      
      // Actualizar configuración
      currentConfig.SYNC_ENABLED = 'false';
      saveEnvConfig(currentConfig);
      console.log('✅ Sincronización desactivada en configuración');
    } else {
      console.log('✅ Conexión a la base de datos reparada');
    }
  } else {
    console.log('✅ Conexión a la base de datos correcta');
  }
  
  // Verificar y corregir configuración de sincronización
  let updated = false;
  
  if (!currentConfig.SYNC_ENABLED) {
    currentConfig.SYNC_ENABLED = SYNC_CONFIG.default.enabled.toString();
    updated = true;
  }
  
  if (!currentConfig.SYNC_INTERVAL) {
    currentConfig.SYNC_INTERVAL = SYNC_CONFIG.default.interval.toString();
    updated = true;
  }
  
  if (!currentConfig.SYNC_MAX_RETRIES) {
    currentConfig.SYNC_MAX_RETRIES = SYNC_CONFIG.default.maxRetries.toString();
    updated = true;
  }
  
  if (!currentConfig.SYNC_TIMEOUT) {
    currentConfig.SYNC_TIMEOUT = SYNC_CONFIG.default.timeout.toString();
    updated = true;
  }
  
  if (updated) {
    console.log('\n🔄 Actualizando configuración de sincronización...');
    saveEnvConfig(currentConfig);
    console.log('✅ Configuración actualizada');
  } else {
    console.log('\n✅ Configuración de sincronización correcta');
  }
  
  console.log('\n📝 Resumen de configuración final:');
  console.log(` - Sincronización: ${currentConfig.SYNC_ENABLED === 'true' ? 'Activada' : 'Desactivada'}`);
  console.log(` - Intervalo: ${currentConfig.SYNC_INTERVAL}ms`);
  console.log(` - Max intentos: ${currentConfig.SYNC_MAX_RETRIES}`);
  console.log(` - Timeout: ${currentConfig.SYNC_TIMEOUT}ms`);
}

// Ejecutar la función principal
fixSyncConfig()
  .then(() => {
    console.log('\n✅ Verificación y corrección de configuración completada');
  })
  .catch(error => {
    console.error('\n❌ Error en la verificación:', error);
  });
