const jwt = require('jsonwebtoken');
const { models } = require('../models');
const logger = require('../config/logger'); // Asegúrate de que la ruta sea correcta

/**
 * Middleware para verificar la validez del token JWT
 */
exports.verifyToken = (req, res, next) => {
  logger.info(`AUTH: verifyToken called for ${req.method} ${req.originalUrl}`);
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('AUTH: No token provided, proceeding in development mode with mock user.');
      req.user = { id: 'dev-user', email: 'dev@example.com', roles: ['Administrador'] };
      logger.info('AUTH: Calling next() in dev mode (no token)');
      return next();
    }
    
    logger.error('Solicitud sin token de autorización:', req.method, req.originalUrl);
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó token de autenticación.'
    });
  }
  
  try {
    // Extraer el token del header (formato: "Bearer TOKEN")
    const bearer = authHeader.split(' ');
    const token = bearer[1];
    
    if (!token) {
      logger.error('Token no encontrado en el header de autorización');
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Utilice el formato "Bearer TOKEN".'
      });
    }
    
    // Verificar si es un token local (para desarrollo)
    if (token.startsWith('local_')) {
      logger.info('Token local detectado, permitiendo acceso para desarrollo');
      // Para desarrollo, permitir acceso con tokens locales
      const userDataEncoded = token.substring(6); // Quitar 'local_'
      try {
        const userData = JSON.parse(atob(userDataEncoded));
        req.user = userData;
        
        // Verificar si el usuario está activo
        if (userData.activo === false) {
          logger.warn('Usuario desactivado intentando acceder:', userData.email);
          return res.status(403).json({
            success: false,
            message: 'Usuario desactivado. Contacte al administrador.'
          });
        }
        
        return next();
      } catch (e) {
        logger.error('Error al decodificar token local:', e);
      }
    }
    
    // Verificar el token JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secrettemporalpararemplazar');
      req.user = decoded;
      logger.info(`AUTH: Token verified for user ${req.user.email}. Calling next().`);
      next();
    } catch (error) {
      logger.error(`AUTH: Invalid token: ${error.message}`);
      if (process.env.NODE_ENV === 'development') {
        logger.warn('AUTH: Invalid token, proceeding in development mode with mock user.');
        req.user = { id: 'dev-user-invalid-token', email: 'dev-invalid@example.com', roles: ['Empleado'] };
        logger.info('AUTH: Calling next() in dev mode (invalid token)');
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: error.message
      });
    }
  } catch (error) {
    logger.error('Error al verificar token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión nuevamente.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido. Por favor, inicie sesión nuevamente.'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 * @param {string|Array} roles - Rol o roles permitidos
 */
exports.hasRole = (roles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Usuario no autenticado.'
      });
    }
    
    // Convertir roles a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Obtener roles del usuario (puede ser string o array)
    const userRoles = Array.isArray(req.user.roles) 
      ? req.user.roles 
      : [req.user.roles];
    
    // Verificar si el usuario tiene alguno de los roles permitidos
    const hasPermission = allowedRoles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tiene los permisos necesarios.'
      });
    }
    
    next();
  };
};
