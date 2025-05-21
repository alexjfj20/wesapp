/**
 * Controlador para verificar el estado del sistema
 */
const { sequelize } = require('../models');
const logger = require('../config/logger');
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');

/**
 * Verifica el estado de la conexión a la base de datos
 */
exports.checkDatabaseStatus = async (req, res) => {
  try {
    // Usar el gestor de conexiones para verificar estado
    const status = await checkDatabaseConnection();
    
    // Enviar respuesta al cliente
    res.json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error al verificar estado de base de datos: ${error.message}`);
    
    res.json({
      success: false,
      connected: false,
      message: 'Error al verificar estado de la base de datos',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Intenta reconectar a la base de datos si se ha perdido la conexión
 */
exports.reconnectDatabase = async (req, res) => {
  try {
    // Primero verificar el estado actual
    const currentStatus = await checkDatabaseConnection();
    
    // Si ambas conexiones están bien, no es necesario reparar
    if (currentStatus.success && currentStatus.sequelizeConnected && currentStatus.poolConnected) {
      return res.json({
        success: true,
        message: 'La base de datos ya está conectada correctamente',
        repaired: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // Intentar reparar las conexiones
    const repairResult = await repairDatabaseConnection();
    
    // Verificar estado tras la reparación
    const finalStatus = await checkDatabaseConnection();
    
    res.json({
      ...repairResult,
      currentStatus: finalStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error al intentar reconectar a la base de datos: ${error.message}`);
    
    res.json({
      success: false,
      message: 'Error al intentar reconectar a la base de datos',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verifica el estado general del sistema
 */
exports.checkSystemStatus = async (req, res) => {
  try {
    // 1. Verificar estado de la base de datos
    const dbStatus = await checkDatabaseConnection();
    
    // 2. Preparar respuesta
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: dbStatus.success ? 'operational' : 'error',
          details: dbStatus
        },
        server: {
          status: 'operational',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    logger.error(`Error al verificar estado del sistema: ${error.message}`);
    
    res.json({
      success: false,
      message: 'Error al verificar estado del sistema',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
