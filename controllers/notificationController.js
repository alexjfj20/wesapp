const Mensaje = require('../models/Mensaje');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
const enviarCorreo = require('../services/emailService');
const { Notification, User } = require('../models');
const logger = require('../config/logger');

// Enviar notificación sobre estado de cuenta
const enviarEstadoCuenta = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { mensaje } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Crear mensaje en la base de datos
    const nuevoMensaje = await Mensaje.create({
      usuario_id: usuarioId,
      tipo: 'estado_cuenta',
      contenido: mensaje
    });

    // Enviar notificación por email
    await enviarCorreo({
      to: usuario.email,
      subject: 'Estado de su cuenta en WebSAP',
      text: mensaje,
      html: `<div>
        <h2>Estado de su cuenta en WebSAP</h2>
        <p>${mensaje}</p>
        <p>Gracias por usar nuestros servicios.</p>
      </div>`
    });

    res.status(201).json({
      success: true,
      message: 'Notificación de estado de cuenta enviada correctamente',
      data: nuevoMensaje
    });
  } catch (error) {
    console.error('Error en enviarEstadoCuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación',
      error: error.message
    });
  }
};

// Enviar aviso de pago
const enviarAvisoPago = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { mensaje, fechaVencimiento, monto } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Crear mensaje en la base de datos
    const nuevoMensaje = await Mensaje.create({
      usuario_id: usuarioId,
      tipo: 'aviso_pago',
      contenido: mensaje
    });

    // Crear o actualizar registro de pago
    const pago = await Pago.create({
      usuario_id: usuarioId,
      fecha_pago: new Date(),
      monto,
      estado: 'pendiente',
      fecha_vencimiento: new Date(fechaVencimiento)
    });

    // Enviar notificación por email
    await enviarCorreo({
      to: usuario.email,
      subject: 'Aviso de pago pendiente - WebSAP',
      text: mensaje,
      html: `<div>
        <h2>Aviso de pago pendiente</h2>
        <p>${mensaje}</p>
        <p><strong>Monto:</strong> $${monto}</p>
        <p><strong>Fecha de vencimiento:</strong> ${new Date(fechaVencimiento).toLocaleDateString()}</p>
        <p>Gracias por usar nuestros servicios.</p>
      </div>`
    });

    res.status(201).json({
      success: true,
      message: 'Aviso de pago enviado correctamente',
      data: { mensaje: nuevoMensaje, pago }
    });
  } catch (error) {
    console.error('Error en enviarAvisoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar aviso de pago',
      error: error.message
    });
  }
};

// Enviar felicitación por pago completado
const enviarFelicitacionPago = async (req, res) => {
  try {
    const { usuarioId, pagoId } = req.params;
    const { mensaje } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el pago existe
    const pago = await Pago.findByPk(pagoId);

    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Actualizar estado del pago
    await pago.update({ estado: 'pagado' });

    // Crear mensaje en la base de datos
    const nuevoMensaje = await Mensaje.create({
      usuario_id: usuarioId,
      tipo: 'felicitacion_pago',
      contenido: mensaje
    });

    // Enviar notificación por email
    await enviarCorreo({
      to: usuario.email,
      subject: '¡Pago completado con éxito! - WebSAP',
      text: mensaje,
      html: `<div>
        <h2>¡Pago completado con éxito!</h2>
        <p>${mensaje}</p>
        <p>Gracias por confiar en nosotros.</p>
      </div>`
    });

    res.status(201).json({
      success: true,
      message: 'Felicitación por pago enviada correctamente',
      data: { mensaje: nuevoMensaje, pago }
    });
  } catch (error) {
    console.error('Error en enviarFelicitacionPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar felicitación por pago',
      error: error.message
    });
  }
};

/**
 * Obtiene las notificaciones para un usuario específico
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar notificaciones para este usuario
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error(`Error al obtener notificaciones: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

/**
 * Crea una nueva notificación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const createNotification = async (req, res) => {
  try {
    const { title, message, userId } = req.body;
    
    // Validar datos requeridos
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'El título y mensaje son requeridos'
      });
    }
    
    // Crear notificación
    const notification = await Notification.create({
      title,
      message,
      userId: userId || req.user.id,
      isRead: false
    });
    
    return res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificación creada exitosamente'
    });
  } catch (error) {
    logger.error(`Error al crear notificación: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al crear notificación',
      error: error.message
    });
  }
};

/**
 * Marca una notificación como leída
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;
    
    // Buscar la notificación
    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar esta notificación'
      });
    }
    
    // Actualizar estado
    notification.isRead = isRead;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notificación actualizada exitosamente'
    });
  } catch (error) {
    logger.error(`Error al actualizar notificación: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar notificación',
      error: error.message
    });
  }
};

/**
 * Elimina una notificación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar la notificación
    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para eliminar esta notificación'
      });
    }
    
    // Eliminar notificación
    await notification.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    logger.error(`Error al eliminar notificación: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
      error: error.message
    });
  }
};

module.exports = {
  enviarEstadoCuenta,
  enviarAvisoPago,
  enviarFelicitacionPago,
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification
};
