// Script para verificar la estructura de las tablas de roles
const { pool, query } = require('../config/dbPool');

async function checkRoles() {
  try {
    console.log('Verificando estructura de tablas de roles...');
    
    // Verificar la estructura de la tabla roles
    console.log('\nEstructura de la tabla roles:');
    const rolesColumns = await query(`
      SHOW COLUMNS FROM roles
    `);
    console.log(rolesColumns);
    
    // Obtener algunos ejemplos de datos de roles
    console.log('\nEjemplos de datos en la tabla roles:');
    const rolesData = await query(`
      SELECT * FROM roles LIMIT 5
    `);
    console.log(rolesData);
    
    // Verificar la estructura de la tabla usuario_roles
    console.log('\nEstructura de la tabla usuario_roles:');
    const usuarioRolesColumns = await query(`
      SHOW COLUMNS FROM usuario_roles
    `);
    console.log(usuarioRolesColumns);
    
    // Obtener algunos ejemplos de datos de usuario_roles
    console.log('\nEjemplos de datos en la tabla usuario_roles:');
    const usuarioRolesData = await query(`
      SELECT * FROM usuario_roles LIMIT 5
    `);
    console.log(usuarioRolesData);
    
    // Obtener un ejemplo de un usuario administrador
    console.log('\nBuscando usuarios administradores:');
    const adminQuery = await query(`
      SELECT ur.*, r.nombre as rol_nombre, u.nombre as usuario_nombre, u.email
      FROM usuario_roles ur
      JOIN roles r ON ur.rol_id = r.id
      JOIN usuarios u ON ur.usuario_id = u.id
      WHERE r.nombre LIKE '%admin%' OR r.nombre LIKE '%Admin%'
      LIMIT 5
    `);
    console.log(adminQuery);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar roles:', error);
    process.exit(1);
  }
}

// Ejecutar la verificación
checkRoles();
