const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/dbPool'); // Usando el pool de conexiones que creamos
const { verifyToken } = require('../middleware/authMiddleware'); // Importar middleware de autenticación
const { runMigration } = require('../migrations/reservas_migration'); // Importar migración de reservas

// Endpoint para ejecutar la migración de reservas
router.get('/migrate-reservas', verifyToken, async (req, res) => {
  try {
    // Verificar que el usuario tiene permisos de administrador
    const userRoles = req.user?.roles || [];
    if (!userRoles.includes('Administrador') && !userRoles.includes('Superadministrador')) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ejecutar esta acción'
      });
    }
    
    // Ejecutar la migración
    const result = await runMigration();
    
    return res.status(200).json({
      success: true,
      message: 'Migración ejecutada correctamente',
      details: result
    });
  } catch (error) {
    console.error('Error al ejecutar migración de reservas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al ejecutar migración',
      error: error.message
    });
  }
});

// Endpoint para recibir reservas desde WhatsApp
router.post('/reservas', verifyToken, async (req, res) => {
  try {
    console.log('📱 Recibida solicitud de reserva desde WhatsApp:', req.body);
    
    // Validar datos básicos
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron datos'
      });
    }
    
    // Extraer datos de la reserva
    const { nombre, telefono, email, fecha, hora, personas, notas, created_by, usuario_id, restaurante_id } = req.body;
    
    // Obtener información del usuario autenticado
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : null;
    
    console.log(`👤 Usuario creando reserva: ${userEmail} (ID: ${userId})`);
    
    // Validar datos mínimos necesarios
    if (!nombre || !telefono || !fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios (nombre, teléfono, fecha, hora)'
      });
    }
    
    // Obtener el restaurante_id del usuario si no se proporcionó
    let userRestauranteId = restaurante_id;
    if (!userRestauranteId && userId) {
      const userRestaurantResult = await query('SELECT restaurante_id FROM usuarios WHERE id = ?', [userId]);
      if (userRestaurantResult && userRestaurantResult.length > 0) {
        userRestauranteId = userRestaurantResult[0].restaurante_id;
      }
    }
    
    // Generar ID único para la reserva
    const reservationId = 'whatsapp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Insertar la reserva en la base de datos
    await query(
      'INSERT INTO reservas (id, nombre, telefono, email, fecha, hora, personas, notas, estado, origen, created_by, usuario_id, restaurante_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [
        reservationId,
        nombre,
        telefono,
        email || '',
        fecha,
        hora,
        personas || 2,
        notas || 'Reserva desde WhatsApp',
        'pendiente',
        'whatsapp',
        created_by || userId, // Usar el ID del usuario autenticado si created_by es null
        usuario_id || null,   // Mantener usuario_id como null para clientes externos
        userRestauranteId     // Incluir el restaurante_id
      ]
    );
    
    console.log(`✅ Reserva de WhatsApp guardada correctamente: ${reservationId}`);
    
    // Crear un registro en la tabla de notificaciones para que el frontend pueda recuperarla
    try {
      // Insertar notificación en la tabla de notificaciones
      await query(
        'INSERT INTO notificaciones (tipo, mensaje, datos, leido, usuario_id, creado_en) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          'nueva_reserva',
          `Nueva reserva de ${nombre} para el ${fecha} a las ${hora}`,
          JSON.stringify({
            reservationId,
            nombre,
            telefono,
            email,
            fecha,
            hora,
            personas,
            notas,
            origen: 'whatsapp'
          }),
          0, // No leída
          userId || null // Para el usuario específico o null para todos
        ]
      );
      
      console.log(`✅ Notificación creada para la reserva: ${reservationId}`);
      
    } catch (notifError) {
      console.error('❌ Error al crear notificación:', notifError);
      // No detener el flujo por este error
    }
    
    // Enviar notificación por correo al administrador (si está configurado el sistema de notificaciones)
    try {
      // Buscar información del administrador del restaurante
      if (userRestauranteId) {
        const adminQuery = `
          SELECT u.id, u.email, u.nombre 
          FROM usuarios u 
          JOIN usuario_roles ur ON u.id = ur.usuario_id 
          JOIN roles r ON ur.rol_id = r.id 
          WHERE r.nombre IN ('Administrador', 'Superadministrador') 
          AND u.restaurante_id = ?
        `;
        
        const admins = await query(adminQuery, [userRestauranteId]);
        
        if (admins && admins.length > 0) {
          const admin = admins[0];
          console.log(`📧 Notificando al administrador: ${admin.email}`);
          
          // Si hay un módulo de notificaciones, usarlo
          if (global.sendEmailNotification) {
            global.sendEmailNotification(
              admin.email,
              'Nueva reserva desde WhatsApp',
              `Se ha recibido una nueva reserva de ${nombre} para el ${fecha} a las ${hora}. Por favor, revise el panel de administración.`
            );
          }
        }
      }
    } catch (notifError) {
      console.error('❌ Error al enviar notificación al administrador:', notifError);
      // No detener el flujo por este error
    }
    
    return res.status(200).json({
      success: true,
      message: 'Reserva recibida correctamente',
      reservationId
    });
  } catch (error) {
    console.error('❌ Error al procesar reserva de WhatsApp:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la reserva',
      error: error.message
    });
  }
});

// Endpoint para obtener reservas
router.get('/reservas', verifyToken, async (req, res) => {
  try {
    console.log('📋 Solicitando lista de reservas');
    
    // Obtener información del usuario actual desde el token JWT
    const currentUser = req.user || {};
    const userRoles = currentUser.roles || [];
    const userId = currentUser.id;
    const userEmail = currentUser.email;
    
    console.log(`👤 Usuario solicitando reservas: ${userEmail} (ID: ${userId}, Roles: ${userRoles.join(', ')})`);
    
    // Obtener el restaurante_id del usuario
    let restauranteId = null;
    if (userId) {
      const userRestaurantResult = await query('SELECT restaurante_id FROM usuarios WHERE id = ?', [userId]);
      if (userRestaurantResult && userRestaurantResult.length > 0) {
        restauranteId = userRestaurantResult[0].restaurante_id;
      }
    }
    
    let query_str = 'SELECT r.* FROM reservas r';
    let whereConditions = [];
    let queryParams = [];
    
    // Aplicar filtros según el rol del usuario
    const isSuperAdmin = userRoles.includes('Superadministrador');
    const isAdmin = userRoles.includes('Administrador');
    
    if (userId) {
      if (isAdmin || isSuperAdmin) {
        // Administradores: ver sus propias reservas y las de usuarios que crearon
        whereConditions.push('(r.created_by = ? OR r.created_by IN (SELECT id FROM usuarios WHERE created_by = ?))');
        queryParams.push(userId, userId);
        console.log(`👥 Aplicando filtro de administrador para usuario ${userEmail}`);
        
        // Filtrar por restaurante si el administrador tiene uno asignado
        if (restauranteId) {
          whereConditions.push('(r.restaurante_id = ? OR r.restaurante_id IS NULL)');
          queryParams.push(restauranteId);
          console.log(`🍽️ Filtrando por restaurante ID: ${restauranteId}`);
        }
      } else {
        // Usuarios regulares: ver sus propias reservas y las del administrador que los creó
        whereConditions.push('(r.created_by = ? OR r.created_by = (SELECT created_by FROM usuarios WHERE id = ?))');
        queryParams.push(userId, userId);
        console.log(`👤 Aplicando filtro de usuario regular para ${userEmail}`);
        
        // Filtrar por restaurante si el usuario tiene uno asignado
        if (restauranteId) {
          whereConditions.push('(r.restaurante_id = ? OR r.restaurante_id IS NULL)');
          queryParams.push(restauranteId);
          console.log(`🍽️ Filtrando por restaurante ID: ${restauranteId}`);
        }
      }
    }
    
    // Construir la consulta final con las condiciones
    if (whereConditions.length > 0) {
      query_str += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Ordenar por fecha de creación descendente
    query_str += ' ORDER BY r.creado_en DESC';
    
    console.log('🔍 Consulta SQL:', query_str);
    console.log('🔢 Parámetros:', queryParams);
    
    // Ejecutar la consulta
    const reservas = await query(query_str, queryParams);
    
    // Marcar notificaciones como leídas si existen
    try {
      if (userId) {
        await query(
          'UPDATE notificaciones SET leido = 1 WHERE tipo = ? AND leido = 0 AND (usuario_id = ? OR usuario_id IS NULL)',
          ['nueva_reserva', userId]
        );
        console.log('✅ Notificaciones de reservas marcadas como leídas');
      }
    } catch (notifError) {
      console.error('❌ Error al actualizar notificaciones:', notifError);
      // No detener el flujo por este error
    }
    
    return res.status(200).json({
      success: true,
      reservas
    });
  } catch (error) {
    console.error('❌ Error al obtener reservas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reservas',
      error: error.message
    });
  }
});

// Endpoint para verificar notificaciones de reservas no leídas
router.get('/notificaciones', verifyToken, async (req, res) => {
  try {
    // En entorno de desarrollo, permitir verificar notificaciones sin token
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Si hay un usuario en req (autenticado) usar su ID, sino null
    const userId = req.user ? req.user.id : null;
    
    if (!userId && !isDevelopment) {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }
    
    // En desarrollo, si no hay userId autenticado, usar un valor predeterminado para pruebas
    const queryUserId = userId || (isDevelopment ? 1 : null); // ID 1 es típicamente el admin
    
    // Obtener notificaciones no leídas para este usuario o para todos
    const notificaciones = await query(
      'SELECT * FROM notificaciones WHERE tipo = ? AND leido = 0 AND (usuario_id = ? OR usuario_id IS NULL) ORDER BY creado_en DESC',
      ['nueva_reserva', queryUserId]
    );
    
    return res.status(200).json({
      success: true,
      hayNotificaciones: notificaciones.length > 0,
      cantidad: notificaciones.length,
      notificaciones
    });
  } catch (error) {
    console.error('❌ Error al verificar notificaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar notificaciones',
      error: error.message
    });
  }
});

module.exports = router;
