// backend/routes/directDeleteRoutes.js

const express = require('express');
const router = express.Router();
const { deletePlatoDirectly } = require('../admin-tools/delete-plato-direct');

// Endpoint para eliminar un plato directamente de MySQL
router.get('/direct-delete', async (req, res) => {
  const platoId = req.query.id;
  
  if (!platoId) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere el ID del plato'
    });
  }
  
  try {
    const success = await deletePlatoDirectly(platoId);
    
    if (success) {
      return res.json({
        success: true,
        message: `Plato con ID ${platoId} eliminado correctamente de la base de datos MySQL`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `No se pudo eliminar el plato con ID ${platoId}`
      });
    }
  } catch (error) {
    console.error('Error en el endpoint direct-delete:', error);
    return res.status(500).json({
      success: false,
      message: `Error al eliminar plato: ${error.message}`
    });
  }
});

module.exports = router;
