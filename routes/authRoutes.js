const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Ruta para iniciar sesión
router.post('/login', authController.login);

// Ruta para registrar un usuario directamente (para pruebas)
router.post('/register', authController.register);

// Ruta para obtener información del usuario actual (requiere autenticación)
router.get('/me', authMiddleware.verifyToken, authController.me);

// Ruta de prueba para verificar autenticación
router.get('/test', authMiddleware.verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Autenticación exitosa',
    user: req.user
  });
});

module.exports = router;
