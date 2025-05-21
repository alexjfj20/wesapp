const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware de protección para todas las rutas
router.use(verifyToken);

// Rutas para gestión de usuarios
// Solución: proporcionar funciones fallback para métodos no implementados
router.get('/', userController.getAllUsers || ((req, res) => {
  res.status(501).json({ message: 'Método no implementado' });
}));

router.get('/:id', userController.getUserById || ((req, res) => {
  res.status(501).json({ message: 'Método no implementado' });
}));

router.post('/', userController.createUser || ((req, res) => {
  res.status(501).json({ message: 'Método no implementado' });
}));

router.put('/:id', userController.updateUser || ((req, res) => {
  res.status(501).json({ message: 'Método no implementado' });
}));

router.delete('/:id', userController.deleteUser || ((req, res) => {
  res.status(501).json({ message: 'Método no implementado' });
}));

module.exports = router;
