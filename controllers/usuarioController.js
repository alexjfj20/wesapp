const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const { createLogActividad } = require('../services/logService');
const logger = require('../config/logger');

/**
 * Obtener todos los usuarios
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.obtenerUsuarios = async (req, res) => {
  try {
    // Obtener todos los usuarios con sus roles
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password_hash'] }, // No devolver la contraseña
      include: [
        {
          model: Rol,
          attributes: ['id', 'nombre'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    logger.error(`Error al obtener usuarios: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener un usuario por su ID
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el usuario por ID incluyendo sus roles
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password_hash'] }, // No devolver la contraseña
      include: [
        {
          model: Rol,
          attributes: ['id', 'nombre'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    logger.error(`Error al obtener usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Crear un nuevo usuario
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, telefono, roles } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico'
      });
    }
    
    // Crear el usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password_hash: password, // El hook beforeCreate se encargará de hash
      telefono,
      estado: 'activo'
    });
    
    // Asignar roles si se proporcionaron
    if (roles && roles.length > 0) {
      const rolesEncontrados = await Rol.findAll({
        where: { id: roles }
      });
      
      if (rolesEncontrados.length > 0) {
        await usuario.setRoles(rolesEncontrados);
      }
    }
    
    // Registrar actividad
    await createLogActividad({
      usuario_id: req.usuario.id,
      accion: `CREAR_USUARIO:${usuario.id}`,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado con éxito',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        estado: usuario.estado
      }
    });
  } catch (error) {
    logger.error(`Error al crear usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al crear el usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Actualizar un usuario existente
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, roles } = req.body;
    
    // Buscar el usuario
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar datos básicos
    if (nombre) usuario.nombre = nombre;
    if (telefono) usuario.telefono = telefono;
    
    // Si se va a cambiar el email, verificar que no exista otro usuario con ese email
    if (email && email !== usuario.email) {
      const existingUser = await Usuario.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro usuario con este correo electrónico'
        });
      }
      usuario.email = email;
    }
    
    // Guardar cambios
    await usuario.save();
    
    // Actualizar roles si se proporcionaron
    if (roles && Array.isArray(roles)) {
      const rolesEncontrados = await Rol.findAll({
        where: { id: roles }
      });
      
      await usuario.setRoles(rolesEncontrados);
    }
    
    // Registrar actividad
    await createLogActividad({
      usuario_id: req.usuario.id,
      accion: `ACTUALIZAR_USUARIO:${usuario.id}`,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Usuario actualizado con éxito',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        estado: usuario.estado
      }
    });
  } catch (error) {
    logger.error(`Error al actualizar usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cambiar el estado de un usuario (activar/desactivar)
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser "activo" o "inactivo"'
      });
    }
    
    // Buscar el usuario
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Cambiar el estado
    usuario.estado = estado;
    await usuario.save();
    
    // Registrar actividad
    await createLogActividad({
      usuario_id: req.usuario.id,
      accion: `CAMBIAR_ESTADO_USUARIO:${usuario.id}:${estado}`,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: `Estado del usuario cambiado a "${estado}" con éxito`,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        estado: usuario.estado
      }
    });
  } catch (error) {
    logger.error(`Error al cambiar estado del usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Eliminar un usuario
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el usuario
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Guardar información para el log antes de eliminar
    const nombreUsuario = usuario.nombre;
    const emailUsuario = usuario.email;
    
    // Eliminar el usuario
    await usuario.destroy();
    
    // Registrar actividad
    await createLogActividad({
      usuario_id: req.usuario.id,
      accion: `ELIMINAR_USUARIO:${id}:${nombreUsuario}`,
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Usuario eliminado con éxito',
      data: {
        id: id,
        nombre: nombreUsuario,
        email: emailUsuario
      }
    });
  } catch (error) {
    logger.error(`Error al eliminar usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
