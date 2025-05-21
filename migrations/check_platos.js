// Script para verificar la estructura de la tabla platos
const { pool, query } = require('../config/dbPool');

async function checkPlatos() {
  try {
    console.log('Verificando estructura de la tabla platos...');
    
    // Obtener la estructura de la tabla platos
    console.log('\nEstructura de la tabla platos:');
    const platosColumns = await query(`
      SHOW COLUMNS FROM platos
    `);
    console.log(platosColumns);
    
    // Obtener algunos ejemplos de datos de platos
    console.log('\nEjemplos de datos en la tabla platos:');
    const platosData = await query(`
      SELECT * FROM platos LIMIT 5
    `);
    console.log(platosData);
    
    // Verificar la estructura de la tabla reservas
    console.log('\nEstructura de la tabla reservas:');
    const reservasColumns = await query(`
      SHOW COLUMNS FROM reservas
    `);
    console.log(reservasColumns);
    
    // Obtener algunos ejemplos de datos de reservas
    console.log('\nEjemplos de datos en la tabla reservas:');
    const reservasData = await query(`
      SELECT * FROM reservas LIMIT 5
    `);
    console.log(reservasData);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    process.exit(1);
  }
}

// Ejecutar la verificación
checkPlatos();
