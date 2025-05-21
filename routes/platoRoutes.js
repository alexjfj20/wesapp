// backend/routes/platoRoutes.js

const express = require('express');
const router = express.Router();
const platoController = require('../controllers/platoController');

// Ruta de prueba para verificar que las rutas de platos funcionan
router.get('/test', (req, res) => {
  res.json({ message: 'Rutas de platos funcionando correctamente' });
});

// Rutas principales
router.get('/', platoController.getPlatos);
router.get('/:id', platoController.getPlatoById);
router.post('/', platoController.createPlato);
router.put('/:id', platoController.updatePlato);
router.delete('/:id', platoController.deletePlato);

module.exports = router;