const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const tempMenuMethods = require('../controllers/tempMenuMethods');

// Middleware de protección para todas las rutas
router.use(verifyToken);

// Rutas para administración
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Ruta para obtener roles
router.get('/roles', userController.getRoles);

// Ruta para elementos del menú (inventario)
router.get('/menu-items', tempMenuMethods.getMenuItems);

// Rutas para estadísticas y dashboard
router.get('/stats', (req, res) => {
  // Endpoint temporal para estadísticas
  res.status(200).json({
    success: true,
    data: {
      totalUsers: 10,
      activeUsers: 8,
      inactiveUsers: 2,
      totalIncome: 15750000,
      status: 'Normal',
      lastBackup: new Date().toISOString(),
      recentActivity: []
    }
  });
});

module.exports = router;
