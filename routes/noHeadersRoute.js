const express = require('express');
const router = express.Router();
const { Plato } = require('../models');

// Endpoint ultra básico sin requisitos de headers
router.get('/ping', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS
  res.send('OK');
});

// Endpoint para verificar conexión MySQL
router.get('/mysql', async (req, res) => {
  try {
    // Consulta simple para verificar que MySQL está funcionando
    const count = await Plato.count();
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS
    res.send(`OK - ${count} platos`);
  } catch (error) {
    console.error('Error al verificar MySQL:', error);
    res.status(500).send('ERROR: ' + error.message);
  }
});

// Endpoint para sincronización ultra-minimal
router.post('/sync', async (req, res) => {
  try {
    let id = null;
    let name = 'Desconocido';
    let price = 0;
    
    // Intentar extraer datos del query string, body o headers
    if (req.query.id) {
      id = req.query.id;
      name = req.query.name || name;
      price = Number(req.query.price) || price;
    } else if (req.body && req.body.id) {
      id = req.body.id;
      name = req.body.name || name;
      price = Number(req.body.price) || price;
    }
    
    if (!id) {
      return res.status(400).send('ERROR: ID requerido');
    }
    
    // Guardar datos básicos en MySQL
    let plato = await Plato.findOne({ where: { id } });
    
    if (plato) {
      // Actualizar
      await plato.update({ name, price, updatedAt: new Date() });
    } else {
      // Crear nuevo
      plato = await Plato.create({
        id,
        name,
        price,
        is_available: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir CORS
    res.send('OK');
  } catch (error) {
    console.error('Error en sincronización sin headers:', error);
    res.status(500).send('ERROR: ' + error.message);
  }
});

module.exports = router;
