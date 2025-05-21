// cors-config.js - Configuración de CORS para WebSAP
module.exports = {
  origin: ['https://websap.site'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 86400, // 24 horas en segundos
  preflightContinue: false,
  optionsSuccessStatus: 204
};
