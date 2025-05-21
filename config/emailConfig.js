const nodemailer = require('nodemailer');
require('dotenv').config();

// Verificar si estamos en entorno de desarrollo
const isDevEnvironment = process.env.NODE_ENV !== 'production';

let transporter = null;

if (isDevEnvironment) {
  // En desarrollo, usar un transportador que no intente conectarse a un servidor real
  console.log('Configurando transportador de email para desarrollo (modo dummy)');
  
  // Crear un transportador que simula el envío de correos
  transporter = {
    sendMail: (options) => {
      console.log('========== EMAIL SIMULADO ==========');
      console.log('Para:', options.to);
      console.log('Asunto:', options.subject);
      console.log('Contenido:', options.text || options.html);
      console.log('===================================');
      return Promise.resolve({ messageId: 'simulado-' + Date.now() });
    },
    verify: () => Promise.resolve(true)
  };
} else {
  // En producción, usar configuración real
  const mailConfig = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  };
  
  // Crear transportador real solo si la configuración está completa
  if (mailConfig.host && mailConfig.port && mailConfig.auth.user && mailConfig.auth.pass) {
    transporter = nodemailer.createTransport(mailConfig);
  }
}

// Función que envía correo
async function sendEmail(options) {
  try {
    if (!transporter) {
      console.log('Envío de correo desactivado - configuración no disponible');
      return { success: false, message: 'Configuración de correo no disponible' };
    }

    const mailOptions = {
      from: process.env.MAIL_FROM || options.from || 'noreply@websap.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
}

// Verificar la configuración del transportador al inicio
if (transporter && typeof transporter.verify === 'function') {
  transporter.verify()
    .then(() => console.log('Configuración de correo verificada correctamente'))
    .catch(err => console.error('Error en la configuración de correo:', err));
} else {
  console.log('Servicio de correo configurado en modo simulado');
}

module.exports = {
  sendEmail,
  isConfigured: !!transporter
};
