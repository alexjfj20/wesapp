/**
 * Rutas para el estado del sistema y verificaciones de salud
 */
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// Ruta de verificación de salud general
router.get('/health-check', systemController.healthCheck);

// Rutas de prueba
router.get('/test/ping', systemController.ping);

// Rutas de sincronización
router.get('/sync/status', systemController.syncStatus);
router.post('/sync/restart', systemController.restartSync);

// Exportar router
module.exports = router;