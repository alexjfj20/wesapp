const express = require('express');
const router = express.Router();
const { Plato, Usuario, Restaurante } = require('../models');
const { sequelize, closeConnection } = require('../config/database');
const { Op } = require('sequelize');
const { models } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Middleware para verificar acceso a restaurante
 */
const verifyRestaurantAccess = async (req, res, next) => {
  try {
    // Obtener información del usuario actual
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return next(); // Si no hay usuario, continuar (para endpoints públicos)
    }
    
    // Obtener el ID del restaurante de los parámetros o del cuerpo
    const restauranteId = req.params.restauranteId || req.body.restauranteId || req.query.restauranteId;
    
    if (!restauranteId) {
      // Si no se especifica restaurante, obtener el restaurante del usuario
      const usuario = await Usuario.findByPk(userId, {
        include: [{ model: Restaurante, as: 'restaurante' }]
      });
      
      if (usuario && usuario.restaurante) {
        req.restauranteId = usuario.restaurante.id;
      }
      
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
        req.restauranteId = restauranteId;
        return next();
      }
    } else {
      // Usuarios regulares: verificar si pertenecen al restaurante
      if (usuario.restaurante && usuario.restaurante.id == restauranteId) {
        req.restauranteId = restauranteId;
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
 * Ruta para sincronización básica de platos
 * POST /api/platos/minimal
 */
router.post('/minimal', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    console.log('Recibida solicitud de sincronización minimalista de plato');
    
    // Validar que tenemos datos básicos
    if (!req.body || !req.body.id) {
      return res.status(400).json({
        success: false,
        message: 'Datos de plato incompletos'
      });
    }
    
    // Log de los datos recibidos (sin imágenes para evitar logs enormes)
    const logData = { ...req.body };
    if (logData.image) {
      logData.image = `[Imagen: ${logData.image.substring(0, 20)}...]`;
    }
    console.log('Datos recibidos para sincronización:', logData);
    
    // Verificar si el plato ya existe
    let plato = await Plato.findOne({ where: { id: req.body.id } });
    
    if (plato) {
      // Actualizar plato existente
      await plato.update(req.body);
      console.log(`Plato actualizado: ${plato.id}`);
    } else {
      // Crear nuevo plato
      plato = await Plato.create(req.body);
      console.log(`Nuevo plato creado: ${plato.id}`);
    }
    
    return res.status(200).json({
      success: true,
      message: plato ? 'Plato sincronizado correctamente' : 'Error al sincronizar plato',
      data: { id: plato.id }
    });
  } catch (error) {
    console.error('Error al sincronizar plato:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al sincronizar plato',
      error: error.message
    });
  }
});

/**
 * Ruta para sincronización de emergencia 
 * POST /api/platos/emergency-sync
 */
router.post('/emergency-sync', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    console.log('Recibida solicitud de sincronización de emergencia');
    
    // Validar datos mínimos
    if (!req.body || !req.body.id) {
      return res.status(400).send('Datos incompletos');
    }
    
    const { id, name, price } = req.body;
    
    // Log básico
    console.log(`Sincronización de emergencia para plato: ${id}, ${name}, ${price}`);
    
    // Verificar si el plato ya existe
    let plato = await Plato.findOne({ where: { id } });
    
    if (plato) {
      // Actualizar campos básicos
      await plato.update({ 
        name, 
        price,
        updatedAt: new Date()
      });
      console.log(`Plato actualizado (emergencia): ${id}`);
    } else {
      // Crear con datos mínimos
      plato = await Plato.create({
        id,
        name,
        price,
        is_available: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Nuevo plato creado (emergencia): ${id}`);
    }
    
    // Respuesta ultra-simple
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en sincronización de emergencia:', error);
    return res.status(500).send('Error');
  }
});

/**
 * Ruta de emergencia para sincronización ultra-minimal
 * POST /api/platos/emergency-minimal
 */
router.post('/emergency-minimal', verifyToken, verifyRestaurantAccess, async (req, res) => {
  try {
    console.log('Recibida solicitud ultra-minimal de emergencia');
    
    // Extraer ID del query string o body como fallback
    const id = req.query.id || (req.body && req.body.id);
    
    if (!id) {
      return res.status(400).send('ID requerido');
    }
    
    // Respuesta simple para confirmar recepción
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en sincronización ultra-minimal:', error);
    return res.status(500).send('Error');
  }
});

/**
 * Función auxiliar para corregir el formato de las imágenes base64
 * @param {string} imageData - Datos de la imagen
 * @returns {string} - Imagen con formato correcto
 */
function fixImageFormat(imageData) {
  if (!imageData) return null;
  
  // Si la imagen ya tiene el formato correcto, devolverla tal cual
  if (typeof imageData === 'string' && (imageData.startsWith('data:image/') || imageData.startsWith('http'))) {
    return imageData;
  }
  
  // Si la imagen es un buffer, convertirla a base64
  if (Buffer.isBuffer(imageData)) {
    return `data:image/jpeg;base64,${imageData.toString('base64')}`;
  }
  
  // Si la imagen es un objeto con datos binarios, convertirla a base64
  if (typeof imageData === 'object' && imageData.data) {
    return `data:image/jpeg;base64,${Buffer.from(imageData.data).toString('base64')}`;
  }
  
  // Si la imagen ya es una cadena base64 sin el prefijo, añadirlo
  if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
    // Verificar si parece base64 (solo caracteres válidos)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64Regex.test(imageData)) {
      return `data:image/jpeg;base64,${imageData}`;
    }
  }
  
  // Si no se pudo determinar el formato, devolver la imagen tal cual
  return imageData;
}

/**
 * Ruta para obtener un menú compartido por su ID
 * GET /api/platos/menu/:id
 */
router.get('/menu/:id', async (req, res) => {
  try {
    const menuId = req.params.id;
    console.log(`Recibida solicitud para obtener menú con ID: ${menuId}`);
    
    if (!menuId) {
      return res.status(400).json({
        success: false,
        message: 'ID de menú no proporcionado'
      });
    }
    
    // Buscar el restaurante por el enlace compartido
    const restaurante = await Restaurante.findOne({
      where: { enlace_compartido: menuId }
    });
    
    if (!restaurante) {
      console.log(`No se encontró restaurante con enlace compartido: ${menuId}`);
      // Si no se encuentra el restaurante, continuar con la lógica actual
      // para mantener la compatibilidad con enlaces antiguos
    }
    
    try {
      // Datos del negocio
      let businessInfo = {
        name: 'Restaurante WebSAP',
        description: 'Deliciosa comida para todos los gustos',
        contact: 'Tel: 123-456-7890',
        address: 'Calle Principal #123',
        logo: null,
        paymentInfo: {
          qrImage: null,
          qrTitle: 'Escanea para pagar',
          nequiNumber: null,
          nequiImage: null,
          bankInfo: 'Banco XYZ - Cuenta 123456789',
          otherPaymentMethods: 'Aceptamos efectivo y tarjetas'
        }
      };
      
      // Si encontramos el restaurante, usar sus datos
      if (restaurante) {
        // Convertir el objeto Sequelize a un objeto plano para manipularlo
        const restauranteData = restaurante.get({ plain: true });
        console.log('Datos del restaurante:', JSON.stringify(restauranteData, null, 2));
        
        // Información básica del negocio
        businessInfo = {
          name: restauranteData.nombre || businessInfo.name,
          description: restauranteData.descripcion || businessInfo.description,
          contact: restauranteData.telefono || businessInfo.contact,
          address: restauranteData.direccion || businessInfo.address,
          logo: restauranteData.logo || businessInfo.logo,
          paymentInfo: { ...businessInfo.paymentInfo } // Mantener la información de pago por defecto
        };
        
        // Si hay información de pago en el restaurante, procesarla
        if (restauranteData.informacion_pago) {
          try {
            const paymentInfo = JSON.parse(restauranteData.informacion_pago);
            // Combinar la información de pago del restaurante con la predeterminada
            businessInfo.paymentInfo = {
              ...businessInfo.paymentInfo,
              ...paymentInfo
            };
          } catch (jsonError) {
            console.error('Error al parsear información de pago:', jsonError);
          }
        }
        
        console.log('Información del negocio procesada:', JSON.stringify(businessInfo, null, 2));
      }
      
      // Obtener los platos
      let whereCondition = {};
      
      // Si encontramos el restaurante, filtrar por restaurante_id
      if (restaurante) {
        whereCondition.restaurante_id = restaurante.id;
      }
      
      // Obtener los platos
      const platos = await Plato.findAll({
        where: whereCondition,
        order: [['name', 'ASC']]
      });
      
      console.log(`Encontrados ${platos ? platos.length : 0} platos`);
      
      if (!platos || platos.length === 0) {
        // Si no hay platos, devolver un menú vacío pero válido
        console.log("No se encontraron platos, devolviendo menú vacío");
        
        const emptyMenu = {
          id: menuId,
          items: [],
          businessInfo: businessInfo,
          createdAt: new Date().toISOString()
        };
        
        return res.status(200).json({
          success: true,
          message: 'Menú obtenido correctamente (vacío)',
          data: emptyMenu
        });
      }
      
      // Procesar las imágenes para asegurar que tengan el formato correcto
      const platosConImagenesCorrectas = platos.map(plato => {
        const platoData = plato.get({ plain: true });
        
        // Verificar si la imagen existe y corregir su formato
        if (platoData.image) {
          platoData.image = fixImageFormat(platoData.image);
          console.log(`Imagen procesada para plato: ${platoData.name}`);
        }
        
        return platoData;
      });
      
      // Construir el objeto de menú
      const menu = {
        id: menuId,
        items: platosConImagenesCorrectas.map(plato => ({
          id: plato.id,
          name: plato.name,
          description: plato.description,
          price: plato.price,
          image: plato.image,
          isSpecial: false, // No tenemos esta información en la tabla platos
          includesDrink: plato.includesDrink || false,
          availableQuantity: plato.availableQuantity || 10
        })),
        businessInfo: businessInfo,
        createdAt: new Date().toISOString()
      };
      
      console.log(`Menú construido con ${menu.items.length} platos`);
      
      return res.status(200).json({
        success: true,
        message: 'Menú obtenido correctamente',
        data: menu
      });
    } catch (platosError) {
      console.error("Error al obtener los platos:", platosError);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los platos',
        error: platosError.message
      });
    }
  } catch (error) {
    console.error('Error al obtener el menú:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el menú',
      error: error.message
    });
  } finally {
    // Cerrar conexiones después de cada operación
    try {
      await closeConnection();
    } catch (closeError) {
      console.error('Error al cerrar conexiones:', closeError);
    }
  }
});

/**
 * Ruta para diagnóstico de sincronización
 * GET /api/platos/sync-status
 */
router.get('/sync-status', async (req, res) => {
  try {
    // Contar platos en MySQL
    const count = await Plato.count();
    
    // Obtener algunos platos para verificar
    const recentPlatos = await Plato.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Estado de sincronización',
      data: {
        total: count,
        recentPlatos: recentPlatos.map(p => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estado de sincronización',
      error: error.message
    });
  }
});

module.exports = router;
