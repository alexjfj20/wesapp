// Script para verificar el esquema de la base de datos
const { pool, query } = require('../config/dbPool');

async function checkSchema() {
  try {
    console.log('Verificando esquema de la base de datos...');
    
    // Obtener información de la tabla usuarios
    console.log('\nEstructura de la tabla usuarios:');
    const usuariosColumns = await query(`
      SHOW COLUMNS FROM usuarios
    `);
    console.log(usuariosColumns);
    
    // Obtener información sobre cómo se almacenan los roles
    console.log('\nBuscando tabla de roles:');
    const tables = await query(`
      SHOW TABLES LIKE '%rol%'
    `);
    console.log(tables);
    
    // Si existe una tabla de roles, examinar su estructura
    if (tables && tables.length > 0) {
      const rolTable = tables[0][`Tables_in_websap (${tables[0].constructor.name === 'Object' ? Object.keys(tables[0])[0] : '%rol%'})`];
      console.log(`\nEstructura de la tabla ${rolTable}:`);
      const rolColumns = await query(`
        SHOW COLUMNS FROM ${rolTable}
      `);
      console.log(rolColumns);
      
      // Obtener algunos ejemplos de datos
      console.log(`\nEjemplos de datos en la tabla ${rolTable}:`);
      const rolData = await query(`
        SELECT * FROM ${rolTable} LIMIT 5
      `);
      console.log(rolData);
    }
    
    // Verificar si existe la tabla usuario_rol
    console.log('\nBuscando tabla usuario_rol:');
    const usuarioRolExists = await query(`
      SHOW TABLES LIKE 'usuario_rol%'
    `);
    console.log(usuarioRolExists);
    
    if (usuarioRolExists && usuarioRolExists.length > 0) {
      console.log('\nEstructura de la tabla usuario_rol:');
      const usuarioRolColumns = await query(`
        SHOW COLUMNS FROM usuario_rol
      `);
      console.log(usuarioRolColumns);
      
      console.log('\nEjemplos de datos en la tabla usuario_rol:');
      const usuarioRolData = await query(`
        SELECT * FROM usuario_rol LIMIT 5
      `);
      console.log(usuarioRolData);
    }
    
    // Verificar si existe la tabla UsuarioRol
    console.log('\nBuscando tabla UsuarioRol:');
    const UsuarioRolExists = await query(`
      SHOW TABLES LIKE 'UsuarioRol%'
    `);
    console.log(UsuarioRolExists);
    
    if (UsuarioRolExists && UsuarioRolExists.length > 0) {
      console.log('\nEstructura de la tabla UsuarioRol:');
      const UsuarioRolColumns = await query(`
        SHOW COLUMNS FROM UsuarioRol
      `);
      console.log(UsuarioRolColumns);
      
      console.log('\nEjemplos de datos en la tabla UsuarioRol:');
      const UsuarioRolData = await query(`
        SELECT * FROM UsuarioRol LIMIT 5
      `);
      console.log(UsuarioRolData);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar esquema:', error);
    process.exit(1);
  }
}

// Ejecutar la verificación
checkSchema();
