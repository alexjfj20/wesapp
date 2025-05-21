// backend/controllers/platoController.js

const Plato = require('../models/Plato');

// Obtener todos los platos
exports.getPlatos = async (req, res) => {
  try {
    console.log('Solicitud para obtener todos los platos');
    const platos = await Plato.findAll();
    console.log(`Obtenidos ${platos.length} platos`);
    res.status(200).json(platos);
  } catch (error) {
    console.error('Error al obtener platos:', error);
    res.status(500).json({ message: 'Error al obtener platos', error: error.message });
  }
};

// Obtener un plato por ID
exports.getPlatoById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Solicitud para obtener plato ID ${id}`);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    console.log(`Plato ID ${id} encontrado`);
    res.status(200).json(plato);
  } catch (error) {
    console.error(`Error al obtener plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener plato', error: error.message });
  }
};

// Crear un nuevo plato
exports.createPlato = async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    
    console.log('Solicitud para crear nuevo plato:', req.body);
    
    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: 'El nombre del plato es obligatorio' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ message: 'El precio del plato es obligatorio' });
    }
    
    const nuevoPlato = await Plato.create({
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'general',
      image_url: image_url || null,
      is_available: is_available !== undefined ? is_available : true
    });
    
    console.log('Nuevo plato creado:', nuevoPlato.toJSON());
    res.status(201).json(nuevoPlato);
  } catch (error) {
    console.error('Error al crear plato:', error);
    res.status(500).json({ message: 'Error al crear plato', error: error.message });
  }
};

// Actualizar un plato
exports.updatePlato = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;
    
    console.log(`Solicitud para actualizar plato ID ${id}:`, req.body);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado para actualizar`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    // Actualizar campos
    if (name !== undefined) plato.name = name;
    if (description !== undefined) plato.description = description;
    if (price !== undefined) plato.price = parseFloat(price);
    if (category !== undefined) plato.category = category;
    if (image_url !== undefined) plato.image_url = image_url;
    if (is_available !== undefined) plato.is_available = is_available;
    
    await plato.save();
    
    console.log(`Plato ID ${id} actualizado correctamente`);
    res.status(200).json(plato);
  } catch (error) {
    console.error(`Error al actualizar plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar plato', error: error.message });
  }
};

// Eliminar un plato
exports.deletePlato = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Solicitud para eliminar plato ID ${id}`);
    
    const plato = await Plato.findByPk(id);
    
    if (!plato) {
      console.log(`Plato ID ${id} no encontrado para eliminar`);
      return res.status(404).json({ message: 'Plato no encontrado' });
    }
    
    await plato.destroy();
    
    console.log(`Plato ID ${id} eliminado correctamente`);
    res.status(200).json({ message: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar plato ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar plato', error: error.message });
  }
};