// migrations/reservas_migration.js

const { pool, query } = require('../config/dbPool');

/**
 * Ejecuta la migración para añadir el campo restaurante_id a la tabla reservas
 */
async function runMigration() {
  try {
    console.log('Iniciando migración de la tabla reservas...');
    
    // Verificar si la columna ya existe
    const checkColumnResult = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reservas' 
      AND COLUMN_NAME = 'restaurante_id'
    `);
    
    if (checkColumnResult && checkColumnResult.length > 0) {
      console.log('La columna restaurante_id ya existe en la tabla reservas');
    } else {
      // Añadir la columna restaurante_id a la tabla reservas sin restricción
      console.log('Añadiendo columna restaurante_id a la tabla reservas...');
      await query(`
        ALTER TABLE reservas 
        ADD COLUMN restaurante_id INT NULL
      `);
      
      // Verificar cuántas claves ya tiene la tabla
      const keysCount = await query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservas'
      `);
      
      // Solo añadir la clave externa si no excede el límite
      if (keysCount[0].count < 64) {
        console.log('Añadiendo clave externa para restaurante_id en reservas...');
        await query(`
          ALTER TABLE reservas 
          ADD CONSTRAINT fk_reservas_restaurante
          FOREIGN KEY (restaurante_id) 
          REFERENCES restaurantes(id)
          ON DELETE SET NULL
        `);
      } else {
        console.log('No se añadió la clave externa debido al límite de claves en MySQL');
      }
      
      console.log('Columna restaurante_id añadida correctamente');
    }
    
    // Actualizar las reservas existentes para asignarles un restaurante
    // basado en el restaurante del usuario que las creó
    console.log('Actualizando reservas existentes...');
    await query(`
      UPDATE reservas r
      JOIN usuarios u ON r.created_by = u.id
      SET r.restaurante_id = u.restaurante_id
      WHERE r.restaurante_id IS NULL
      AND u.restaurante_id IS NOT NULL
    `);
    
    console.log('Migración completada con éxito');
    return { success: true, message: 'Migración completada con éxito' };
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  }
}

module.exports = {
  runMigration
};
