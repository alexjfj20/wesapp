// backend/migrations/add-informacion-pago-to-restaurantes.js

const { sequelize } = require('../config/database');

/**
 * Migración para añadir la columna informacion_pago a la tabla restaurantes
 */
async function runMigration() {
  try {
    console.log('Iniciando migración: Añadir columna informacion_pago a la tabla restaurantes');
    
    // Verificar si la columna ya existe
    const [results] = await sequelize().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'restaurantes' 
      AND COLUMN_NAME = 'informacion_pago'
    `);
    
    if (results.length > 0) {
      console.log('La columna informacion_pago ya existe en la tabla restaurantes');
      return { success: true, message: 'La columna ya existe' };
    }
    
    // Añadir la columna informacion_pago
    await sequelize().query(`
      ALTER TABLE restaurantes 
      ADD COLUMN informacion_pago TEXT
    `);
    
    console.log('Columna informacion_pago añadida correctamente a la tabla restaurantes');
    return { success: true, message: 'Migración completada correctamente' };
  } catch (error) {
    console.error('Error al ejecutar la migración:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  runMigration
};
