// Rutas para funciones de seguridad
const express = require('express');
const router = express.Router();
const securityController = require('../controllers/tempUserMethods');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('Administrador')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: se requieren privilegios de administrador'
    });
  }
  next();
};

// Middleware para verificar si el usuario es superadministrador
const isSuperAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('Superadministrador')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: se requieren privilegios de superadministrador'
    });
  }
  next();
};

// Ruta para registrar actividad sospechosa
router.post('/log-suspicious', securityController.logSuspiciousRequest);

// Rutas protegidas que requieren autenticación
router.use(authMiddleware.verifyToken);

// Rutas que requieren ser administrador
router.use(isAdmin);

// Obtener resumen de actividad sospechosa (admin)
router.get('/activity-summary', securityController.getSuspiciousActivitySummary);

// Verificar si se debe desafiar a un cliente
router.post('/should-challenge', securityController.shouldChallengeClient);

// Rutas que requieren ser superadministrador
router.use(isSuperAdmin);

// Bloquear IP maliciosa
router.post('/block-ip', securityController.blockSuspiciousIP);

// Actualizar reglas de seguridad
router.put('/rules', securityController.updateSecurityRules);

module.exports = router;