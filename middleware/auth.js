const jwt = require('jsonwebtoken');
const { Usuario, UsuarioRol } = require('../models');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }
    
    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'websap_secret_key_muy_segura_2023');
      
      // Añadir usuario decodificado a la solicitud
      req.user = decoded;
      
      next();
    } catch (tokenError) {
      console.error('Error al verificar token:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servidor'
    });
  }
};

// Middleware para verificar si el usuario es Superadministrador
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar roles del usuario
    const userRoles = await UsuarioRol.findAll({
      where: { usuario_id: userId }
    });
    
    // Verificar si tiene el rol de Superadministrador
    const isSuperAdmin = userRoles.some(role => role.rol === 'Superadministrador');
    
    if (isSuperAdmin) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de Superadministrador'
    });
  } catch (error) {
    console.error('Error al verificar rol de Superadministrador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servidor'
    });
  }
};

// Middleware para verificar si el usuario es Administrador o superior
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar roles del usuario
    const userRoles = await UsuarioRol.findAll({
      where: { usuario_id: userId }
    });
    
    // Verificar si tiene el rol de Administrador o Superadministrador
    const hasAdminRole = userRoles.some(role => 
      role.rol === 'Administrador' || role.rol === 'Superadministrador'
    );
    
    if (hasAdminRole) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de Administrador o superior'
    });
  } catch (error) {
    console.error('Error al verificar rol de Administrador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servidor'
    });
  }
};

module.exports = {
  verifyToken,
  isSuperAdmin,
  isAdmin
};
