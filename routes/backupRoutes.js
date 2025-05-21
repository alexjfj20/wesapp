const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middleware/auth');

/**
 * Rutas para gestión de backups
 */

// Verificar que los controladores existan
if (!backupController || typeof backupController.getBackups !== 'function') {
  console.error('Error: backupController.getBackups no está definido correctamente');
  
  // Implementar controladores temporales si faltan
  backupController.getBackups = backupController.getBackups || ((req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Función no implementada: getBackups'
    });
  });
  
  backupController.createBackup = backupController.createBackup || ((req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Función no implementada: createBackup'
    });
  });
  
  backupController.restoreBackup = backupController.restoreBackup || ((req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Función no implementada: restoreBackup'
    });
  });
  
  backupController.downloadBackup = backupController.downloadBackup || ((req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Función no implementada: downloadBackup'
    });
  });
  
  backupController.deleteBackup = backupController.deleteBackup || ((req, res) => {
    return res.status(501).json({
      success: false,
      message: 'Función no implementada: deleteBackup'
    });
  });
}

// Crear un backup de la base de datos (solo superadmin)
router.post('/create', 
  authMiddleware.verifyToken,
  authMiddleware.isSuperAdmin, 
  backupController.createBackup
);

// Obtener lista de backups disponibles (solo superadmin)
router.get('/list', 
  authMiddleware.verifyToken,
  authMiddleware.isSuperAdmin, 
  backupController.getBackups
);

// Restaurar un backup específico (solo superadmin)
router.post('/restore/:filename', 
  authMiddleware.verifyToken,
  authMiddleware.isSuperAdmin, 
  backupController.restoreBackup
);

// Descargar un backup específico (solo superadmin)
router.get('/download/:filename', 
  authMiddleware.verifyToken,
  authMiddleware.isSuperAdmin, 
  backupController.downloadBackup
);

// Eliminar un backup específico (solo superadmin)
router.delete('/:filename', 
  authMiddleware.verifyToken,
  authMiddleware.isSuperAdmin, 
  backupController.deleteBackup
);

module.exports = router;
