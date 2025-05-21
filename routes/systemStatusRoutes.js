/**
 * Rutas para verificar el estado del sistema
 */
const express = require('express');
const router = express.Router();

// Endpoint de estado del sistema
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sistema en línea',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de ping para verificación básica
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de verificación de salud
router.get('/health-check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sistema funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
