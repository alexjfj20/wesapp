/**
 * Gestor de conexión a la base de datos
 * Este archivo proporciona funcionalidad para manejar y monitorear la conexión a la BD
 */
const { Sequelize } = require('sequelize');
const path = require('path');
const db = require('../models');
const env = process.env.NODE_ENV || 'development';

// Variable para almacenar el estado de la conexión
let isConnected = false;
let lastReconnectAttempt = null;
const reconnectInterval = 5000; // 5 segundos entre intentos de reconexión

/**
 * Verifica el estado de la conexión a la base de datos
 * @returns {Promise<Object>} Estado de la conexión
 */
async function checkConnection() {
  try {
    await db.sequelize.authenticate();
    isConnected = true;
    return {
      success: true,
      status: 'connected',
      message: 'Conexión a la base de datos establecida correctamente',
      timestamp: new Date().toISOString(),
      dialect: db.sequelize.getDialect(),
      database: db.sequelize.config.database,
    };
  } catch (error) {
    isConnected = false;
    return {
      success: false,
      status: 'disconnected',
      message: `Error de conexión: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Intenta reconectar a la base de datos
 * @returns {Promise<Object>} Resultado del intento de reconexión
 */
async function reconnect() {
  // Evitar intentos de reconexión muy frecuentes
  const now = Date.now();
  if (lastReconnectAttempt && now - lastReconnectAttempt < reconnectInterval) {
    return {
      success: false,
      status: 'throttled',
      message: 'Intento de reconexión muy frecuente, espere un momento',
      nextAttemptIn: reconnectInterval - (now - lastReconnectAttempt),
    };
  }
  
  lastReconnectAttempt = now;
  console.log('🔄 Intentando reconectar a la base de datos...');
  
  try {
    // Cerrar conexión existente si está presente
    if (db.sequelize) {
      try {
        await db.sequelize.close();
        console.log('Conexión anterior cerrada correctamente');
      } catch (closeError) {
        console.error('Error al cerrar la conexión anterior:', closeError);
      }
    }
    
    // Intentar reconectar
    await db.sequelize.authenticate();
    isConnected = true;
    console.log('✅ Reconexión exitosa a la base de datos');
    
    return {
      success: true,
      status: 'reconnected',
      message: 'Reconexión exitosa a la base de datos',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    isConnected = false;
    console.error('❌ Error al reconectar a la base de datos:', error);
    
    return {
      success: false,
      status: 'failed',
      message: `Error al reconectar: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Inicializa la conexión a la base de datos
 * @returns {Promise<Object>} Resultado de la inicialización
 */
async function initializeConnection() {
  console.log('🚀 Inicializando conexión a la base de datos...');
  
  try {
    // Verificar si hay modelos que sincronizar
    const modelCount = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize'
    ).length;
    
    console.log(`📊 Modelos detectados: ${modelCount}`);
    
    // Autenticar la conexión
    await db.sequelize.authenticate();
    isConnected = true;
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // Sincronizar modelos con la base de datos
    const syncOptions = {
      // En producción, sería más seguro no alterar la estructura de la BD automáticamente
      alter: process.env.NODE_ENV !== 'production'
    };
    
    await db.sequelize.sync(syncOptions);
    console.log('✅ Modelos sincronizados con la base de datos');
    
    return {
      success: true,
      status: 'initialized',
      message: 'Conexión a la base de datos inicializada correctamente',
      timestamp: new Date().toISOString(),
      dialect: db.sequelize.getDialect(),
      database: db.sequelize.config.database,
      models: modelCount,
    };
  } catch (error) {
    isConnected = false;
    console.error('❌ Error al inicializar la conexión a la base de datos:', error);
    
    return {
      success: false,
      status: 'error',
      message: `Error al inicializar la conexión: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Cierra la conexión a la base de datos de forma limpia
 * @returns {Promise<Object>} Resultado del cierre
 */
async function closeConnection() {
  console.log('👋 Cerrando conexión a la base de datos...');
  
  try {
    if (db.sequelize) {
      await db.sequelize.close();
      isConnected = false;
      console.log('✅ Conexión a la base de datos cerrada correctamente');
      
      return {
        success: true,
        status: 'closed',
        message: 'Conexión a la base de datos cerrada correctamente',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: true,
        status: 'not_connected',
        message: 'No hay conexión activa para cerrar',
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('❌ Error al cerrar la conexión a la base de datos:', error);
    
    return {
      success: false,
      status: 'error',
      message: `Error al cerrar la conexión: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Obtiene estadísticas de la base de datos
 * @returns {Promise<Object>} Estadísticas
 */
async function getDatabaseStats() {
  if (!isConnected) {
    return {
      success: false,
      message: 'No hay conexión activa a la base de datos',
      timestamp: new Date().toISOString(),
    };
  }
  
  try {
    const stats = {
      dialect: db.sequelize.getDialect(),
      database: db.sequelize.config.database,
      host: db.sequelize.config.host,
      port: db.sequelize.config.port,
      models: Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize').length,
      timestamp: new Date().toISOString(),
    };
    
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al obtener estadísticas: ${error.message}`,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

module.exports = {
  checkConnection,
  reconnect,
  initializeConnection,
  closeConnection,
  getDatabaseStats,
  get isConnected() {
    return isConnected;
  }
};
