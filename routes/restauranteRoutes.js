// backend/routes/restauranteRoutes.js

const express = require('express');
const router = express.Router();
const { Restaurante, Usuario, Plato } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');
const { runMigration } = require('../migrations/restaurantes_migration');
const { runMigration: addInformacionPagoMigration } = require('../migrations/add-informacion-pago-to-restaurantes');

/**
 * Middleware para verificar acceso a restaurante
 */
const verifyRestaurantAccess = async (req, res, next) => {
  try {
    // Obtener información del usuario actual
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }
    
    // Obtener el ID del restaurante de los parámetros o del cuerpo
    const restauranteId = req.params.restauranteId || req.body.restauranteId || req.query.restauranteId;
    
    if (!restauranteId) {
      // Si no se especifica restaurante, continuar (para endpoints que no requieren restaurante específico)
      return next();
    }
    
    // Obtener el usuario con su información de restaurante
    const usuario = await Usuario.findByPk(userId, {
      include: [{ model: Restaurante, as: 'restaurante' }]
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si el usuario es administrador
    const isAdmin = req.user.roles && (req.user.roles.includes('Administrador') || req.user.roles.includes('Superadministrador'));
    
    // Verificar acceso al restaurante
    if (isAdmin) {
      // Administradores: verificar si el restaurante pertenece al administrador
      const restaurante = await Restaurante.findOne({
        where: { id: restauranteId, created_by: userId }
      });
      
      if (restaurante) {
        req.restaurante = restaurante;
        return next();
      }
    } else {
      // Usuarios regulares: verificar si pertenecen al restaurante
      if (usuario.restaurante && usuario.restaurante.id == restauranteId) {
        req.restaurante = usuario.restaurante;
        return next();
      }
    }
    
    // Si llegamos aquí, el usuario no tiene acceso al restaurante
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este restaurante'
    });
    
  } catch (error) {
    console.error('Error al verificar acceso a restaurante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar acceso a restaurante'
    });
  }
};

/**
 * Ruta para ejecutar la migración (solo para desarrollo)
 * GET /api/restaurantes/migrate
 */
router.get('/migrate', async (req, res) => {
  try {
    await runMigration();
    return res.status(200).json({
      success: true,
      message: 'Migración ejecutada correctamente'
    });
  } catch (error) {
    console.error('Error al ejecutar migración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al ejecutar migración',
      error: error.message
    });
  }
});

/**
 * Ruta para ejecutar la migración que añade la columna informacion_pago a la tabla restaurantes
 * GET /api/restaurantes/migrate/add-informacion-pago
 */
router.get('/migrate/add-informacion-pago', async (req, res) => {
  try {
    const result = await addInformacionPagoMigration();
    return res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error al ejecutar migración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al ejecutar migración',
      error: error.message
    });
  }
});

/**
 * Ruta para crear un nuevo restaurante
 * POST /api/restaurantes
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const isAdmin = req.user.roles && (req.user.roles.includes('Administrador') || req.user.roles.includes('Superadministrador'));
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden crear restaurantes'
      });
    }
    
    // Validar datos básicos
    if (!req.body.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del restaurante es obligatorio'
      });
    }
    
    // Crear el restaurante
    const restaurante = await Restaurante.create({
      nombre: req.body.nombre,
      direccion: req.body.direccion || '',
      telefono: req.body.telefono || '',
      horarios: req.body.horarios || '',
      logo: req.body.logo || '',
      descripcion: req.body.descripcion || '',
      enlace_compartido: `menu-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      created_by: req.user.id
    });
    
    // Actualizar el usuario para asociarlo al restaurante
    await Usuario.update(
      { restaurante_id: restaurante.id },
      { where: { id: req.user.id } }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Restaurante creado correctamente',
      restaurante
    });
    
  } catch (error) {
    console.error('Error al crear restaurante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear restaurante',
      error: error.message
    });
  }
});

/**
 * Ruta para obtener todos los restaurantes del administrador
 * GET /api/restaurantes
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const isAdmin = req.user.roles && (req.user.roles.includes('Administrador') || req.user.roles.includes('Superadministrador'));
    
    if (!isAdmin) {
      // Si es usuario regular, obtener su restaurante
      const usuario = await Usuario.findByPk(req.user.id, {
        include: [{ model: Restaurante, as: 'restaurante' }]
      });
      
      if (usuario && usuario.restaurante) {
        return res.status(200).json({
          success: true,
          restaurantes: [usuario.restaurante]
        });
      } else {
        return res.status(200).json({
          success: true,
          restaurantes: []
        });
      }
    }
    
    // Si es administrador, obtener todos sus restaurantes
    const restaurantes = await Restaurante.findAll({
      where: { created_by: req.user.id }
    });
    
    return res.status(200).json({
      success: true,
      restaurantes
    });
    
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener restaurantes',
      error: error.message
    });
  }
});

/**
 * Ruta para obtener un restaurante específico
 * GET /api/restaurantes/:restauranteId
 */
router.get('/:restauranteId', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      restaurante: req.restaurante
    });
  } catch (error) {
    console.error('Error al obtener restaurante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener restaurante',
      error: error.message
    });
  }
});

/**
 * Ruta para actualizar un restaurante
 * PUT /api/restaurantes/:restauranteId
 */
router.put('/:restauranteId', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    // Actualizar el restaurante
    await req.restaurante.update({
      nombre: req.body.nombre || req.restaurante.nombre,
      direccion: req.body.direccion || req.restaurante.direccion,
      telefono: req.body.telefono || req.restaurante.telefono,
      horarios: req.body.horarios || req.restaurante.horarios,
      logo: req.body.logo || req.restaurante.logo,
      descripcion: req.body.descripcion || req.restaurante.descripcion,
      informacion_pago: req.body.informacion_pago || req.restaurante.informacion_pago
    });
    
    return res.status(200).json({
      success: true,
      message: 'Restaurante actualizado correctamente',
      restaurante: req.restaurante
    });
    
  } catch (error) {
    console.error('Error al actualizar restaurante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar restaurante',
      error: error.message
    });
  }
});

/**
 * Ruta para regenerar el enlace compartido del restaurante
 * POST /api/restaurantes/:restauranteId/regenerate-link
 */
router.post('/:restauranteId/regenerate-link', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    // Generar nuevo enlace compartido
    const nuevoEnlace = `menu-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Actualizar el restaurante
    await req.restaurante.update({
      enlace_compartido: nuevoEnlace
    });
    
    return res.status(200).json({
      success: true,
      message: 'Enlace compartido regenerado correctamente',
      enlace_compartido: nuevoEnlace
    });
    
  } catch (error) {
    console.error('Error al regenerar enlace compartido:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al regenerar enlace compartido',
      error: error.message
    });
  }
});

/**
 * Ruta para asignar un usuario a un restaurante
 * POST /api/restaurantes/:restauranteId/asignar-usuario/:usuarioId
 */
router.post('/:restauranteId/asignar-usuario/:usuarioId', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const isAdmin = req.user.roles && (req.user.roles.includes('Administrador') || req.user.roles.includes('Superadministrador'));
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden asignar usuarios a restaurantes'
      });
    }
    
    // Verificar si el usuario a asignar existe y fue creado por el administrador actual
    const usuario = await Usuario.findOne({
      where: { 
        id: req.params.usuarioId,
        created_by: req.user.id
      }
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no tienes permiso para asignarlo'
      });
    }
    
    // Asignar el usuario al restaurante
    await usuario.update({
      restaurante_id: req.restaurante.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Usuario asignado al restaurante correctamente'
    });
    
  } catch (error) {
    console.error('Error al asignar usuario a restaurante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asignar usuario a restaurante',
      error: error.message
    });
  }
});

module.exports = router;
