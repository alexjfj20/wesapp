const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// Rutas para las notificaciones
router.get('/', authMiddleware.verifyToken, notificationController.getNotifications || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Esta funcionalidad no está implementada aún'
  });
}));

router.post('/', authMiddleware.verifyToken, notificationController.createNotification || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Esta funcionalidad no está implementada aún'
  });
}));

router.put('/:id', authMiddleware.verifyToken, notificationController.updateNotification || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Esta funcionalidad no está implementada aún'
  });
}));

router.delete('/:id', authMiddleware.verifyToken, notificationController.deleteNotification || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Esta funcionalidad no está implementada aún'
  });
}));

module.exports = router;
