// Script completo para ejecutar la migración manualmente
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/dbPool');

async function runManualMigration() {
  try {
    console.log('Iniciando migración manual...');
    
    // Paso 1: Crear tabla restaurantes si no existe
    console.log('Paso 1: Creando tabla restaurantes...');
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
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabla restaurantes creada o ya existente');
    
    // Paso 2: Añadir columna restaurante_id a la tabla platos si no existe
    console.log('Paso 2: Verificando columna restaurante_id en tabla platos...');
    const platosColumnCheck = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'platos' 
      AND COLUMN_NAME = 'restaurante_id'
    `);
    
    if (!platosColumnCheck || platosColumnCheck.length === 0) {
      console.log('Añadiendo columna restaurante_id a la tabla platos...');
      await query(`ALTER TABLE platos ADD COLUMN restaurante_id INT NULL`);
      console.log('Columna añadida correctamente');
    } else {
      console.log('La columna restaurante_id ya existe en la tabla platos');
    }
    
    // Paso 3: Verificar si la columna restaurante_id existe en la tabla reservas
    console.log('Paso 3: Verificando columna restaurante_id en tabla reservas...');
    const reservasColumnCheck = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reservas' 
      AND COLUMN_NAME = 'restaurante_id'
    `);
    
    if (!reservasColumnCheck || reservasColumnCheck.length === 0) {
      console.log('Añadiendo columna restaurante_id a la tabla reservas...');
      await query(`ALTER TABLE reservas ADD COLUMN restaurante_id INT NULL`);
      console.log('Columna añadida correctamente');
    } else {
      console.log('La columna restaurante_id ya existe en la tabla reservas');
    }
    
    // Paso 4: Obtener los usuarios con roles de administrador
    console.log('Paso 4: Obteniendo usuarios administradores...');
    const admins = await query(`
      SELECT DISTINCT u.id, u.nombre, u.email 
      FROM usuarios u
      JOIN usuario_roles ur ON u.id = ur.usuario_id
      WHERE ur.rol LIKE '%Administrador%' OR ur.rol LIKE '%Superadministrador%'
    `);
    
    console.log(`Se encontraron ${admins.length} administradores`);
    
    // Paso 5: Crear un restaurante por defecto para cada administrador
    console.log('Paso 5: Creando restaurantes por defecto para administradores...');
    
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    for (const admin of admins) {
      // Verificar si el administrador ya tiene un restaurante
      const restauranteCheck = await query(`
        SELECT id FROM restaurantes WHERE created_by = ?
      `, [admin.id]);
      
      if (!restauranteCheck || restauranteCheck.length === 0) {
        // Generar un enlace compartido único
        const enlaceCompartido = 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        
        // Crear un restaurante para el administrador
        const insertResult = await query(`
          INSERT INTO restaurantes (nombre, descripcion, created_by, enlace_compartido, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          `Restaurante de ${admin.nombre}`,
          `Restaurante gestionado por ${admin.email}`,
          admin.id,
          enlaceCompartido,
          currentDate,
          currentDate
        ]);
        
        console.log(`Restaurante creado para ${admin.email} con ID ${insertResult.insertId}`);
      } else {
        console.log(`El administrador ${admin.email} ya tiene un restaurante asignado`);
      }
    }
    
    // Paso 6: Asignar restaurantes a los administradores
    console.log('Paso 6: Asignando restaurantes a los administradores...');
    await query(`
      UPDATE usuarios u
      JOIN restaurantes r ON r.created_by = u.id
      SET u.restaurante_id = r.id
      WHERE u.restaurante_id IS NULL
    `);
    
    // Paso 7: Asignar restaurantes a los usuarios creados por administradores
    console.log('Paso 7: Asignando restaurantes a los usuarios...');
    await query(`
      UPDATE usuarios u
      JOIN usuarios admin ON u.created_by = admin.id
      SET u.restaurante_id = admin.restaurante_id
      WHERE u.restaurante_id IS NULL
      AND admin.restaurante_id IS NOT NULL
    `);
    
    // Paso 8: Asignar restaurantes a los platos
    console.log('Paso 8: Asignando restaurantes a los platos...');
    await query(`
      UPDATE platos p
      JOIN usuarios u ON p.created_by = u.id
      SET p.restaurante_id = u.restaurante_id
      WHERE p.restaurante_id IS NULL
      AND u.restaurante_id IS NOT NULL
    `);
    
    // Paso 9: Asignar restaurantes a las reservas
    console.log('Paso 9: Asignando restaurantes a las reservas...');
    await query(`
      UPDATE reservas r
      JOIN usuarios u ON r.created_by = u.id
      SET r.restaurante_id = u.restaurante_id
      WHERE r.restaurante_id IS NULL
      AND u.restaurante_id IS NOT NULL
    `);
    
    console.log('Migración completada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
runManualMigration();
