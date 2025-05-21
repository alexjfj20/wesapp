const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Usuario, UsuarioRol } = require('../models');

// Controlador para iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Intento de login:', { email });
    
    // Validar datos de entrada
    if (!email || !password) {
      console.log('Datos de entrada incompletos');
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // Buscar usuario por email
    console.log('Buscando usuario con email:', email);
    const usuario = await Usuario.findOne({
      where: { email }
    });
    
    if (!usuario) {
      console.log(`Usuario no encontrado: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // Convertir a objeto plano para facilitar el logging
    const usuarioData = usuario.get({ plain: true });
    
    console.log(`Usuario encontrado: ID=${usuarioData.id}, Email=${usuarioData.email}`);
    console.log(`Estado del usuario: activo=${usuarioData.activo}, tipo=${typeof usuarioData.activo}`);
    console.log('Contraseña almacenada:', usuarioData.password);
    
    // Verificar si el usuario está activo
    if (usuarioData.activo === false) {
      console.log(`Usuario desactivado: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado. Contacte al administrador.'
      });
    }
    
    // Verificar contraseña - intentar todas las posibilidades
    let passwordMatch = false;
    
    // 1. Comparar como texto plano (para usuarios creados directamente)
    if (password === usuarioData.password) {
      console.log('Coincidencia de contraseña en texto plano: true');
      passwordMatch = true;
    } 
    // 2. Verificar si es una contraseña hasheada con bcrypt
    else if (usuarioData.password && usuarioData.password.startsWith('$2')) {
      try {
        console.log('Intentando comparar contraseña hasheada con bcrypt');
        passwordMatch = await bcrypt.compare(password, usuarioData.password);
        console.log('Resultado de comparación bcrypt:', passwordMatch);
      } catch (error) {
        console.error('Error al comparar contraseñas hasheadas:', error);
      }
    }
    
    if (!passwordMatch) {
      console.log(`Contraseña incorrecta para ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // Obtener roles del usuario
    console.log('Buscando roles para el usuario ID:', usuarioData.id);
    const roles = await UsuarioRol.findAll({
      where: { usuario_id: usuarioData.id }
    });
    
    console.log('Roles encontrados:', roles.length);
    const userRoles = roles.map(role => role.rol);
    console.log('Roles del usuario:', userRoles);
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuarioData.id, 
        email: usuarioData.email,
        nombre: usuarioData.nombre,
        roles: userRoles,
        activo: usuarioData.activo
      },
      process.env.JWT_SECRET || 'websap_secret_key_muy_segura_2023',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log(`Login exitoso para ${email}`);
    
    // Responder con el token y datos del usuario
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: usuarioData.id,
          email: usuarioData.email,
          nombre: usuarioData.nombre,
          roles: userRoles,
          activo: usuarioData.activo
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Controlador para obtener información del usuario actual
exports.me = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar usuario por ID
    const usuario = await Usuario.findByPk(userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener roles del usuario
    const roles = await UsuarioRol.findAll({
      where: { usuario_id: userId }
    });
    
    const userRoles = roles.map(role => role.rol);
    
    // Responder con datos del usuario
    return res.status(200).json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servidor',
      error: error.message
    });
  }
};

// Controlador para registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, roles = ['Empleado'] } = req.body;
    
    console.log('Intento de registro:', { email, nombre, roles });
    
    // Validar datos de entrada
    if (!nombre || !email || !password) {
      console.log('Datos de entrada incompletos');
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }
    
    // Verificar si el usuario ya existe
    console.log('Verificando si el usuario ya existe:', email);
    const usuarioExistente = await Usuario.findOne({
      where: { email }
    });
    
    if (usuarioExistente) {
      console.log(`Usuario ya existe: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado'
      });
    }
    
    // Crear contraseña en texto plano para facilitar pruebas
    // En producción, siempre usar hash
    console.log('Creando usuario con contraseña en texto plano para pruebas');
    
    // Crear el usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password, // Guardar contraseña en texto plano para pruebas
      activo: true
    });
    
    console.log(`Usuario creado: ID=${usuario.id}, Email=${usuario.email}`);
    
    // Crear roles para el usuario
    console.log('Asignando roles al usuario:', roles);
    for (const rol of roles) {
      await UsuarioRol.create({
        usuario_id: usuario.id,
        rol
      });
    }
    
    console.log('Roles asignados correctamente');
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        nombre: usuario.nombre,
        roles
      },
      process.env.JWT_SECRET || 'websap_secret_key_muy_segura_2023',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log(`Registro exitoso para ${email}`);
    
    // Responder con el token y datos del usuario
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          roles
        }
      }
    });
  } catch (error) {
    console.error('Error en registro de usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servidor',
      error: error.message
    });
  }
};
