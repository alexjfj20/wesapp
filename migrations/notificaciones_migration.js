// migrations/notificaciones_migration.js

const { pool, query } = require('../config/dbPool');

/**
 * Ejecuta la migración para crear la tabla notificaciones si no existe
 */
async function runMigration() {
  try {
    console.log('Iniciando migración de la tabla notificaciones...');
    
    // Verificar si la tabla ya existe
    const checkTableResult = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'notificaciones'
    `);
    
    if (checkTableResult && checkTableResult.length > 0) {
      console.log('La tabla notificaciones ya existe');
    } else {
      // Crear la tabla notificaciones
      console.log('Creando tabla notificaciones...');
      await query(`
        CREATE TABLE notificaciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tipo VARCHAR(50) NOT NULL,
          mensaje TEXT NOT NULL,
          datos TEXT,
          leido TINYINT(1) DEFAULT 0,
          usuario_id INT,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX (tipo),
          INDEX (usuario_id),
          INDEX (leido),
          CONSTRAINT fk_notificaciones_usuario
            FOREIGN KEY (usuario_id) 
            REFERENCES usuarios(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('Tabla notificaciones creada correctamente');
    }
    
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