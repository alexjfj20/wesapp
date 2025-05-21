const express = require('express');
const router = express.Router();

/**
 * @route GET /api/test/ping
 * @desc Endpoint simple para verificar que el servidor está respondiendo
 * @access Public
 */
router.get('/ping', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    clientIp: req.ip || req.connection.remoteAddress
  });
});

/**
 * @route GET /api/test/health
 * @desc Verificar el estado de salud del sistema
 * @access Public
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

/**
 * @route GET /api/test/error
 * @desc Endpoint para probar manejo de errores
 * @access Public
 */
router.get('/error', (req, res) => {
  try {
    // Generar un error a propósito
    throw new Error('Error de prueba generado intencionalmente');
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error generado para prueba',
      error: error.message
    });
  }
});

/**
 * @route GET /api/test/auth-check
 * @desc Endpoint para probar autenticación
 * @access Public
 */
router.get('/auth-check', (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No se encontró token de autorización',
      authenticated: false
    });
  }
  
  // En una implementación real, verificaríamos el token aquí
  res.status(200).json({
    success: true,
    message: 'Token de autorización recibido',
    authenticated: true
  });
});

module.exports = router;
