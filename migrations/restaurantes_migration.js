// backend/migrations/restaurantes_migration.js

const { pool, query } = require('../config/dbPool');

/**
 * Ejecuta la migración para crear la tabla de restaurantes y actualizar las tablas relacionadas
 */
async function runMigration() {
  try {
    console.log('Iniciando migración...');
    
    // Paso 1: Verificar si la tabla restaurantes ya existe
    const checkTableResult = await query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'restaurantes'
    `);
    
    // Si la tabla no existe, crearla
    if (!checkTableResult || checkTableResult.length === 0) {
      console.log('Creando tabla restaurantes...');
      await query(`
        CREATE TABLE IF NOT EXISTS restaurantes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          direccion VARCHAR(255),
          telefono VARCHAR(50),
          descripcion TEXT,
          logo VARCHAR(255),
          enlace_compartido VARCHAR(100) UNIQUE,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
        )
      `);
      console.log('Tabla restaurantes creada correctamente');
    } else {
      console.log('La tabla restaurantes ya existe');
    }
    
    // Paso 2: Verificar si la columna restaurante_id existe en la tabla platos
    const checkPlatosColumnResult = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'platos' 
      AND COLUMN_NAME = 'restaurante_id'
    `);
    
    // Si la columna no existe en platos, añadirla
    if (!checkPlatosColumnResult || checkPlatosColumnResult.length === 0) {
      console.log('Añadiendo columna restaurante_id a la tabla platos...');
      
      // Primero añadir la columna
      await query(`
        ALTER TABLE platos 
        ADD COLUMN restaurante_id INT NULL
      `);
      
      // Luego añadir la clave externa
      await query(`
        ALTER TABLE platos 
        ADD CONSTRAINT fk_platos_restaurante
        FOREIGN KEY (restaurante_id) 
        REFERENCES restaurantes(id)
        ON DELETE SET NULL
      `);
      
      console.log('Columna restaurante_id añadida a la tabla platos');
    } else {
      console.log('La columna restaurante_id ya existe en la tabla platos');
    }
    
    // Paso 3: Verificar si la columna restaurante_id existe en la tabla usuarios
    const checkUsuariosColumnResult = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'usuarios' 
      AND COLUMN_NAME = 'restaurante_id'
    `);
    
    // Si la columna no existe en usuarios, añadirla
    if (!checkUsuariosColumnResult || checkUsuariosColumnResult.length === 0) {
      console.log('Añadiendo columna restaurante_id a la tabla usuarios...');
      
      // Primero añadir la columna sin restricción
      await query(`
        ALTER TABLE usuarios 
        ADD COLUMN restaurante_id INT NULL
      `);
      
      // Verificar cuántas claves ya tiene la tabla
      const keysCount = await query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
      `);
      
      // Solo añadir la clave externa si no excede el límite
      if (keysCount[0].count < 64) {
        console.log('Añadiendo clave externa para restaurante_id en usuarios...');
        await query(`
          ALTER TABLE usuarios 
          ADD CONSTRAINT fk_usuarios_restaurante
          FOREIGN KEY (restaurante_id) 
          REFERENCES restaurantes(id)
          ON DELETE SET NULL
        `);
      } else {
        console.log('No se añadió la clave externa debido al límite de claves en MySQL');
      }
      
      console.log('Columna restaurante_id añadida a la tabla usuarios');
    } else {
      console.log('La columna restaurante_id ya existe en la tabla usuarios');
    }
    
    // Paso 4: Crear un restaurante por defecto para cada administrador
    console.log('Creando restaurantes por defecto para administradores...');
    
    // Obtener todos los administradores
    const admins = await query(`
      SELECT id, nombre, email 
      FROM usuarios 
      WHERE roles LIKE '%Administrador%' OR roles LIKE '%Superadministrador%'
    `);
    
    // Para cada administrador, crear un restaurante si no tiene uno
    for (const admin of admins) {
      // Verificar si el administrador ya tiene un restaurante
      const restauranteResult = await query(`
        SELECT id FROM restaurantes WHERE created_by = ?
      `, [admin.id]);
      
      if (!restauranteResult || restauranteResult.length === 0) {
        // Generar un enlace compartido único
        const enlaceCompartido = 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        
        // Crear un restaurante para el administrador
        const insertResult = await query(`
          INSERT INTO restaurantes (nombre, descripcion, created_by, enlace_compartido)
          VALUES (?, ?, ?, ?)
        `, [
          `Restaurante de ${admin.nombre}`,
          `Restaurante gestionado por ${admin.email}`,
          admin.id,
          enlaceCompartido
        ]);
        
        // Asignar el restaurante al administrador
        if (insertResult && insertResult.insertId) {
          await query(`
            UPDATE usuarios SET restaurante_id = ? WHERE id = ?
          `, [insertResult.insertId, admin.id]);
          
          // Asignar el mismo restaurante a los usuarios creados por este administrador
          await query(`
            UPDATE usuarios SET restaurante_id = ? WHERE created_by = ?
          `, [insertResult.insertId, admin.id]);
          
          console.log(`Restaurante creado para ${admin.email} con ID ${insertResult.insertId}`);
        }
      } else {
        console.log(`El administrador ${admin.email} ya tiene un restaurante asignado`);
      }
    }
    
    // Paso 5: Asignar restaurantes a los platos existentes
    console.log('Asignando restaurantes a platos existentes...');
    await query(`
      UPDATE platos p
      JOIN usuarios u ON p.created_by = u.id
      SET p.restaurante_id = u.restaurante_id
      WHERE p.restaurante_id IS NULL
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
