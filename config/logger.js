const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear el directorio de logs si no existe
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Definir formato para los logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Crear el logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Log de errores y advertencias en un archivo
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Log de todos los niveles
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    // Log específico para actividad de usuarios
    new winston.transports.File({ 
      filename: path.join(logDir, 'user-activity.log'),
      level: 'info'
    }),
  ],
});

// Si no estamos en producción, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

// Logger básico para desarrollo
const basicLogger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  debug: (message) => console.debug(`[DEBUG] ${message}`)
};

module.exports = process.env.NODE_ENV === 'production' ? logger : basicLogger;
