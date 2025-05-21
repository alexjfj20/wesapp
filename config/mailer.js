const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || '127.0.0.1',
  port: process.env.MAIL_PORT || 587,
  secure: false, // Usar true para puerto 465, false para otros puertos
  auth: {
    user: process.env.MAIL_USER || '', // Usuario del correo
    pass: process.env.MAIL_PASS || ''  // Contraseña del correo
  }
});

module.exports = transporter;
