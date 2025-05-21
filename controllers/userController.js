const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, UsuarioRol } = require('../models'); // Usar los modelos correctos
const { Op } = require('sequelize'); // Importar Op directamente de sequelize
const logger = require('../config/logger');

// Importar métodos temporales
const tempMethods = require('./tempUserMethods');

// Agregar métodos temporales al controlador
exports.getUsers = tempMethods.getUsers;
exports.getRoles = tempMethods.getRoles;

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear usuario
    const user = await Usuario.create({
      nombre,
      email,
      password: hashedPassword,
      roles: ['Empleado'], // Rol por defecto
      activo: true
    });
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET || 'secrettemporalpararemplazar',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    logger.error(`Error en registro: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await Usuario.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }
    
    // Verificar estado
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Este usuario está inactivo. Contacte al administrador.'
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET || 'secrettemporalpararemplazar',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    logger.error(`Error en login: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`Error al obtener perfil: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del usuario'
    });
  }
};

/**
 * Actualizar perfil del usuario autenticado
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const userId = req.user.id;
    
    const user = await Usuario.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar campos
    if (nombre) user.nombre = nombre;
    if (email) user.email = email;
    
    // Si se proporciona contraseña, hashearla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email
      }
    });
  } catch (error) {
    logger.error(`Error al actualizar perfil: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

/**
 * Obtener lista de usuarios (admin)
 */
exports.getUsers = async (req, res) => {
  try {
    console.log('Obteniendo lista de usuarios');
    
    // Procesar parámetros de consulta
    const { search, role, status } = req.query;
    console.log('Query params recibidos:', req.query);
    console.log('Filtros procesados:', { search, role, status });
    
    // Construir condiciones de búsqueda
    const whereConditions = {};
    
    // Filtrar por estado (activo/inactivo)
    if (status) {
      if (status === 'activo') {
        whereConditions.activo = true;
      } else if (status === 'inactivo') {
        whereConditions.activo = false;
      }
      console.log(`Filtro por estado: ${status}`);
    }
    
    // Obtener el usuario actual desde el token
    const currentUserEmail = req.user ? req.user.email : null;
    let currentUserId = null;
    
    // Buscar el ID del usuario actual si tenemos su email
    if (currentUserEmail) {
      const currentUser = await Usuario.findOne({ where: { email: currentUserEmail } });
      if (currentUser) {
        currentUserId = currentUser.id;
      }
    }
    
    // Obtener los roles del usuario actual
    const userRoles = req.user && req.user.roles ? req.user.roles : [];
    const isSuperAdmin = userRoles.includes('Superadministrador');
    const isAdmin = userRoles.includes('Administrador');
    
    // Aplicar filtros según el tipo de usuario
    if (currentUserEmail) {
      // Caso 1: Para Superadministrador
      if (isSuperAdmin) {
        // El Superadministrador puede ver todos los administradores que él ha creado
        // y todos los usuarios que él ha creado
        whereConditions[Op.or] = [
          { email: currentUserEmail }, // Su propio usuario
          { created_by: currentUserId ? currentUserId.toString() : null } // Usuarios y administradores creados por él
        ];
        console.log(`Superadmin: Filtrando usuarios creados por: ${currentUserEmail} (ID: ${currentUserId})`);
      }
      // Caso 2: Para Administradores regulares (susan@gmail.com, karen@gmail.com, etc.)
      else if (isAdmin || currentUserEmail === 'susan@gmail.com' || currentUserEmail === 'karen@gmail.com') {
        // Los administradores regulares solo pueden ver los usuarios que ellos han creado
        whereConditions[Op.or] = [
          { email: currentUserEmail }, // Su propio usuario
          { created_by: currentUserId ? currentUserId.toString() : null } // Usuarios creados por este administrador
        ];
        console.log(`Admin: Filtrando usuarios creados por: ${currentUserEmail} (ID: ${currentUserId})`);
      }
      // Caso 3: Para otros usuarios (empleados, etc.)
      // No se aplican filtros adicionales, verán todos los usuarios según los otros filtros
    }
    
    // Filtrar por término de búsqueda (después de las condiciones anteriores)
    if (search && search.length >= 2) {
      // Si ya hay condiciones, no sobrescribir
      if (!whereConditions.email) {
        whereConditions[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }
      console.log(`Filtro por búsqueda: ${search}`);
    }
    
    console.log('Condiciones de búsqueda finales:', JSON.stringify(whereConditions));
    
    // Obtener usuarios con los filtros aplicados
    const users = await Usuario.findAll({ 
      where: whereConditions,
      attributes: { exclude: ['password'] },
      include: [{
        model: UsuarioRol,
        as: 'roles',
        attributes: ['rol']
      }]
    });
    
    console.log(`Se encontraron ${users.length} usuarios`);
    
    // Formatear los usuarios para la respuesta
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // Obtener los roles del usuario directamente de la tabla usuario_roles
      const userRoles = await UsuarioRol.findAll({
        where: { usuario_id: user.id },
        attributes: ['rol']
      });
      
      const roles = userRoles.map(ur => ur.rol);
      
      // Formatear la fecha de creación
      const createdAt = user.createdAt || user.created_at;
      
      // Convertir a un objeto plano con los campos necesarios
      return {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || '',
        roles: roles,
        fecha_creacion: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
        estado: user.activo ? 'activo' : 'inactivo'
      };
    }));
    
    // Filtrar por rol si se especificó
    let filteredUsers = formattedUsers;
    if (role) {
      filteredUsers = formattedUsers.filter(user => 
        user.roles && user.roles.includes(role)
      );
      console.log(`Después de filtrar por rol: ${filteredUsers.length} usuarios`);
    }
    
    res.json({
      success: true,
      data: filteredUsers
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener usuario por ID (admin)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`Error al obtener usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

/**
 * Crear usuario (admin)
 */
exports.createUser = async (req, res) => {
  logger.info(`USER_CONTROLLER: createUser called for ${req.method} ${req.originalUrl}. Body: ${JSON.stringify(req.body)}`);
  try {
    const { nombre, email, password, roles } = req.body; // Asegúrate de que 'roles' se maneje si es necesario

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nombre, email y contraseña son requeridos para crear usuario (desde userController)"
      });
    }

    // TODO: Implementar la lógica real de creación de usuario aquí.
    // Esto incluye hashear la contraseña, guardar en la base de datos, asignar roles, etc.
    // Ejemplo (muy simplificado y sin guardar en BD):
    const newUser = {
      id: Date.now(), // Placeholder ID
      nombre,
      email,
      roles: roles || ['Empleado'], // Rol por defecto
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.info(`Placeholder: Usuario ${email} sería creado aquí con datos: ${JSON.stringify(newUser)}`);

    // Simular una creación exitosa
    return res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente (placeholder en userController)",
      data: newUser
    });

  } catch (error) {
    logger.error(`Error en userController.createUser: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear usuario (desde userController)',
      error: error.message
    });
  }
};

/**
 * Actualizar usuario (admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { nombre, email, password, roles, activo } = req.body;
    const userId = req.params.id;
    
    console.log(`Actualizando usuario con ID ${userId}:`, req.body);
    console.log(`Tipo de ID: ${typeof userId}, Valor: ${userId}`);
    console.log(`Estado recibido: ${activo}, Tipo: ${typeof activo}`);
    
    // Buscar el usuario - probar con diferentes métodos para asegurar que lo encontramos
    let user = null;
    
    // Método 1: Buscar por ID exacto
    user = await Usuario.findByPk(userId);
    console.log(`Método 1 (findByPk): Usuario encontrado: ${user ? 'Sí' : 'No'}`);
    
    // Si no se encuentra, intentar con where
    if (!user) {
      user = await Usuario.findOne({ where: { id: userId } });
      console.log(`Método 2 (findOne where id): Usuario encontrado: ${user ? 'Sí' : 'No'}`);
    }
    
    // Si aún no se encuentra, intentar convertir a número
    if (!user) {
      const numericId = parseInt(userId, 10);
      user = await Usuario.findOne({ where: { id: numericId } });
      console.log(`Método 3 (findOne where id numeric): Usuario encontrado: ${user ? 'Sí' : 'No'}`);
    }
    
    // Si no se encuentra el usuario, devolver error
    if (!user) {
      console.log(`Usuario con ID ${userId} no encontrado`);
      return res.status(404).json({
        success: false,
        message: `Usuario con ID ${userId} no encontrado`
      });
    }
    
    // Obtener datos actuales del usuario
    const userData = user.get({ plain: true });
    console.log(`Usuario encontrado: ID=${userData.id}, Email=${userData.email}, Activo=${userData.activo}`);
    
    // Actualizar campos básicos
    if (nombre) user.nombre = nombre;
    if (email) user.email = email;
    
    // Actualizar estado (activo/inactivo)
    if (req.body.activo !== undefined) {
      // Manejar el valor numérico (1 o 0) que viene del frontend
      const activoValue = req.body.activo === 1 || req.body.activo === true || req.body.activo === '1';
      user.activo = activoValue ? 1 : 0;
      console.log(`Actualizando estado a: ${user.activo} (Valor original: ${req.body.activo}, Tipo: ${typeof req.body.activo})`);
    } else if (activo !== undefined) {
      // Mantener compatibilidad con el formato anterior
      const activoValue = activo === 'activo';
      user.activo = activoValue ? 1 : 0;
      console.log(`Actualizando estado a: ${user.activo} (${activo})`);
    }
    
    // Si se proporciona contraseña, guardarla en texto plano para desarrollo
    // En producción, debería hashearse
    if (password) {
      console.log('Actualizando contraseña');
      user.password = password;
    }
    
    // Guardar cambios en el usuario
    await user.save();
    console.log(`Usuario actualizado en la base de datos`);
    console.log(`Estado después de actualizar: ${user.activo}`);
    
    // Actualizar roles si se proporcionaron
    if (roles && Array.isArray(roles)) {
      console.log(`Actualizando roles: ${roles.join(', ')}`);
      
      // Eliminar roles actuales
      await UsuarioRol.destroy({
        where: { usuario_id: user.id }
      });
      
      // Crear nuevos roles
      for (const rol of roles) {
        await UsuarioRol.create({
          usuario_id: user.id,
          rol
        });
      }
      
      console.log('Roles actualizados correctamente');
    }
    
    // Obtener roles actualizados
    const userRoles = await UsuarioRol.findAll({
      where: { usuario_id: user.id }
    });
    
    const rolesList = userRoles.map(ur => ur.rol);
    console.log(`Roles finales: ${rolesList.join(', ')}`);
    
    // Responder con el usuario actualizado
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        roles: rolesList,
        estado: user.activo ? 'activo' : 'inactivo'
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * Eliminar usuario (admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(`Eliminando usuario con ID ${userId}`);
    
    // Buscar el usuario
    const user = await Usuario.findByPk(userId);
    if (!user) {
      console.log(`Usuario con ID ${userId} no encontrado`);
      return res.status(404).json({
        success: false,
        message: `Usuario con ID ${userId} no encontrado`
      });
    }
    
    console.log(`Usuario encontrado: ${user.email}`);
    
    // Eliminar roles del usuario
    console.log(`Eliminando roles del usuario`);
    await UsuarioRol.destroy({
      where: { usuario_id: userId }
    });
    
    // Eliminar el usuario
    console.log(`Eliminando usuario de la base de datos`);
    await user.destroy();
    
    console.log(`Usuario eliminado correctamente`);
    
    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

/**
 * Obtener roles disponibles en el sistema
 */
exports.getRoles = async (req, res) => {
  try {
    console.log('Obteniendo roles disponibles');
    
    // Lista de roles predefinidos
    const roles = [
      { id: 1, nombre: 'Superadministrador', descripcion: 'Control total del sistema' },
      { id: 2, nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
      { id: 3, nombre: 'Empleado', descripcion: 'Operaciones básicas' }
    ];
    
    // En una implementación completa, estos roles se obtendrían de la base de datos
    // const roles = await Rol.findAll();
    
    console.log(`Se encontraron ${roles.length} roles`);
    
    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};
