// Script de diagnóstico para problemas de autenticación en WebSAP
const { sequelize, Usuario, UsuarioRol } = require('../models');
const bcrypt = require('bcrypt');

// Función para mostrar todos los usuarios
async function listarUsuarios() {
  try {
    console.log('\n=== USUARIOS EN LA BASE DE DATOS ===');
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'activo'],
      raw: true
    });
    
    console.table(usuarios);
    console.log(`Total de usuarios: ${usuarios.length}`);
    
    return usuarios;
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
}

// Función para mostrar los roles de los usuarios
async function listarRoles() {
  try {
    console.log('\n=== ROLES DE USUARIOS ===');
    const roles = await UsuarioRol.findAll({
      raw: true
    });
    
    console.table(roles);
    console.log(`Total de roles asignados: ${roles.length}`);
    
    return roles;
  } catch (error) {
    console.error('Error al listar roles:', error);
  }
}

// Función para identificar usuarios sin roles
async function identificarUsuariosSinRoles() {
  try {
    console.log('\n=== USUARIOS SIN ROLES ASIGNADOS ===');
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email'],
      raw: true
    });
    
    const usuariosSinRoles = [];
    
    for (const usuario of usuarios) {
      const roles = await UsuarioRol.findAll({
        where: { usuario_id: usuario.id },
        raw: true
      });
      
      if (roles.length === 0) {
        usuariosSinRoles.push(usuario);
      }
    }
    
    if (usuariosSinRoles.length > 0) {
      console.table(usuariosSinRoles);
      console.log(`Total de usuarios sin roles: ${usuariosSinRoles.length}`);
    } else {
      console.log('No se encontraron usuarios sin roles asignados.');
    }
    
    return usuariosSinRoles;
  } catch (error) {
    console.error('Error al identificar usuarios sin roles:', error);
  }
}

// Función para asignar el rol de Empleado a usuarios sin roles
async function asignarRolEmpleado(usuariosSinRoles) {
  try {
    console.log('\n=== ASIGNANDO ROL DE EMPLEADO A USUARIOS SIN ROLES ===');
    
    if (!usuariosSinRoles || usuariosSinRoles.length === 0) {
      console.log('No hay usuarios sin roles para asignar.');
      return;
    }
    
    for (const usuario of usuariosSinRoles) {
      await UsuarioRol.create({
        usuario_id: usuario.id,
        rol: 'Empleado'
      });
      
      console.log(`Rol 'Empleado' asignado al usuario ${usuario.email} (ID: ${usuario.id})`);
    }
    
    console.log(`Se asignó el rol 'Empleado' a ${usuariosSinRoles.length} usuarios.`);
  } catch (error) {
    console.error('Error al asignar roles:', error);
  }
}

// Función para verificar y corregir contraseñas
async function verificarContraseñas() {
  try {
    console.log('\n=== VERIFICACIÓN DE CONTRASEÑAS ===');
    const usuarios = await Usuario.findAll({
      raw: true
    });
    
    let contraseñasHasheadas = 0;
    let contraseñasTextoPlano = 0;
    
    for (const usuario of usuarios) {
      if (usuario.password && usuario.password.startsWith('$2')) {
        contraseñasHasheadas++;
      } else {
        contraseñasTextoPlano++;
      }
    }
    
    console.log(`Contraseñas hasheadas: ${contraseñasHasheadas}`);
    console.log(`Contraseñas en texto plano: ${contraseñasTextoPlano}`);
    
    return { contraseñasHasheadas, contraseñasTextoPlano };
  } catch (error) {
    console.error('Error al verificar contraseñas:', error);
  }
}

// Función principal
async function ejecutarDiagnostico() {
  try {
    console.log('=== INICIANDO DIAGNÓSTICO DE AUTENTICACIÓN WEBSAP ===');
    console.log('Fecha y hora:', new Date().toLocaleString());
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Ejecutar diagnósticos
    const usuarios = await listarUsuarios();
    await listarRoles();
    const usuariosSinRoles = await identificarUsuariosSinRoles();
    await verificarContraseñas();
    
    // Corregir problemas detectados
    console.log('\n=== CORRECCIONES AUTOMÁTICAS ===');
    await asignarRolEmpleado(usuariosSinRoles);
    
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    console.log('Recomendaciones:');
    console.log('1. Reinicie el servidor después de aplicar las correcciones');
    console.log('2. Intente iniciar sesión con un usuario empleado');
    console.log('3. Verifique los logs del servidor para detectar errores adicionales');
    
  } catch (error) {
    console.error('Error en el diagnóstico:', error);
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('Conexión a la base de datos cerrada.');
  }
}

// Ejecutar el diagnóstico
ejecutarDiagnostico();
