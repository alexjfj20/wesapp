const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const Mensaje = require('../models/Mensaje');

// Configurar el transporte de correo
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verificar la configuración del transporte
  transporter.verify()
    .then(() => console.log('Servidor SMTP listo para enviar correos'))
    .catch(err => console.error('Error en la configuración de correo:', err));
} catch (error) {
  console.error('Error al crear el transporte de correo:', error);
}

/**
 * Envía un correo electrónico
 * @param {Object} options - Opciones del correo (to, subject, text, html)
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarCorreo(options) {
  try {
    if (!transporter) {
      throw new Error('Transporte de correo no configurado');
    }

    // Validación básica
    if (!options.to) {
      throw new Error('El destinatario (to) es requerido');
    }
    
    if (!options.subject) {
      throw new Error('El asunto (subject) es requerido');
    }
    
    if (!options.text && !options.html) {
      throw new Error('El contenido del correo (text o html) es requerido');
    }
    
    // Configuración del correo
    const mailOptions = {
      from: `"WebSAP" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || ''
    };
    
    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
}

/**
 * Envía una notificación programada de pago pendiente
 * @param {Object} usuario - Datos del usuario
 * @param {Object} pago - Datos del pago
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarNotificacionPagoPendiente(usuario, pago) {
  // Calcular días restantes para el pago
  const fechaVencimiento = new Date(pago.fecha_vencimiento);
  const hoy = new Date();
  const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
  
  let mensaje = '';
  let asunto = '';
  
  if (diasRestantes <= 0) {
    asunto = '🔴 ¡Pago vencido! - WebSAP';
    mensaje = `<div>
      <h2>Su pago está vencido</h2>
      <p>Estimado/a ${usuario.nombre},</p>
      <p>Le recordamos que su pago por el servicio WebSAP está vencido. Por favor, regularice su situación lo antes posible para evitar la suspensión del servicio.</p>
      <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
      <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento.toLocaleDateString()}</p>
      <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
      <p>Gracias por usar WebSAP.</p>
    </div>`;
  } else if (diasRestantes <= 3) {
    asunto = '🟠 Recordatorio de pago próximo a vencer - WebSAP';
    mensaje = `<div>
      <h2>Su pago vence pronto</h2>
      <p>Estimado/a ${usuario.nombre},</p>
      <p>Le recordamos que su pago por el servicio WebSAP vence en ${diasRestantes} día(s). Por favor, asegúrese de realizarlo antes de la fecha de vencimiento.</p>
      <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
      <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento.toLocaleDateString()}</p>
      <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
      <p>Gracias por usar WebSAP.</p>
    </div>`;
  } else if (diasRestantes <= 7) {
    asunto = '🟡 Recordatorio de pago - WebSAP';
    mensaje = `<div>
      <h2>Recordatorio de pago</h2>
      <p>Estimado/a ${usuario.nombre},</p>
      <p>Le recordamos que tiene un pago pendiente por el servicio WebSAP.</p>
      <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
      <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento.toLocaleDateString()} (En ${diasRestantes} días)</p>
      <p>Si ya realizó el pago, por favor ignore este mensaje.</p>
      <p>Gracias por usar WebSAP.</p>
    </div>`;
  }
  
  if (mensaje) {
    return await enviarCorreo({
      to: usuario.email,
      subject: asunto,
      html: mensaje
    });
  }
  
  return null;
}

/**
 * Envía una felicitación por pago completado
 * @param {Object} usuario - Datos del usuario
 * @param {Object} pago - Datos del pago
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarFelicitacionPago(usuario, pago) {
  const asunto = '🟢 ¡Pago recibido con éxito! - WebSAP';
  const mensaje = `<div>
    <h2>¡Gracias por su pago!</h2>
    <p>Estimado/a ${usuario.nombre},</p>
    <p>Hemos recibido correctamente su pago por el servicio WebSAP.</p>
    <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
    <p><strong>Fecha de pago:</strong> ${new Date().toLocaleDateString()}</p>
    <p>Su servicio continuará activo hasta la próxima fecha de pago.</p>
    <p>Agradecemos su preferencia y confianza en WebSAP.</p>
  </div>`;
  
  return await enviarCorreo({
    to: usuario.email,
    subject: asunto,
    html: mensaje
  });
}

module.exports = {
  enviarCorreo,
  enviarNotificacionPagoPendiente,
  enviarFelicitacionPago
};
