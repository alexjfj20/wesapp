/**
 * Middleware de autenticación para proteger rutas
 */
const jwt = require('jsonwebtoken');
const { User, Usuario } = require('../models');

/**
 * Middleware para verificar token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header "Authorization"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'websap_secret_key');
    
    // Buscar usuario en la base de datos
    // Intentar con ambos modelos de usuario (User y Usuario) para mayor compatibilidad
    let user = null;
    
    try {
      if (User) {
        user = await User.findByPk(decoded.id);
      }
    } catch (error) {
      console.log('Error al buscar en modelo User:', error.message);
    }
    
    if (!user && Usuario) {
      try {
        user = await Usuario.findByPk(decoded.id);
      } catch (error) {
        console.log('Error al buscar en modelo Usuario:', error.message);
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o token inválido'
      });
    }
    
    // Añadir usuario a la solicitud
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar permisos de administrador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const isAdmin = async (req, res, next) => {
  try {
    // Se asume que verifyToken se ejecutó antes y req.user está disponible
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    // Verificar si el usuario tiene rol de administrador
    // La implementación puede variar según la estructura de la base de datos
    const isUserAdmin = req.user.rol === 'admin' || 
                       req.user.rolId === 1 || 
                       (req.user.permisos && req.user.permisos.includes('admin'));
    
    if (!isUserAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren privilegios de administrador'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};