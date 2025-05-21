// Script final para ejecutar la migración manualmente
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
    
    // Paso 2: Verificar si la columna restaurante_id existe en la tabla reservas
    console.log('Paso 2: Verificando columna restaurante_id en tabla reservas...');
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
    
    // Paso 3: Obtener los usuarios con roles de administrador
    console.log('Paso 3: Obteniendo usuarios administradores...');
    const admins = await query(`
      SELECT DISTINCT u.id, u.nombre, u.email 
      FROM usuarios u
      JOIN usuario_roles ur ON u.id = ur.usuario_id
      WHERE ur.rol LIKE '%Administrador%' OR ur.rol LIKE '%Superadministrador%'
    `);
    
    console.log(`Se encontraron ${admins.length} administradores`);
    
    // Paso 4: Crear un restaurante por defecto para cada administrador
    console.log('Paso 4: Creando restaurantes por defecto para administradores...');
    
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
    
    // Paso 5: Asignar restaurantes a los administradores
    console.log('Paso 5: Asignando restaurantes a los administradores...');
    await query(`
      UPDATE usuarios u
      JOIN restaurantes r ON r.created_by = u.id
      SET u.restaurante_id = r.id
      WHERE u.restaurante_id IS NULL
    `);
    
    // Paso 6: Asignar restaurantes a los usuarios creados por administradores
    console.log('Paso 6: Asignando restaurantes a los usuarios...');
    await query(`
      UPDATE usuarios u
      JOIN usuarios admin ON u.created_by = admin.id
      SET u.restaurante_id = admin.restaurante_id
      WHERE u.restaurante_id IS NULL
      AND admin.restaurante_id IS NOT NULL
    `);
    
    // Paso 7: Crear un restaurante por defecto si no hay ninguno
    console.log('Paso 7: Verificando si existe al menos un restaurante...');
    const restaurantesCount = await query(`
      SELECT COUNT(*) as count FROM restaurantes
    `);
    
    if (restaurantesCount[0].count === 0) {
      console.log('No se encontraron restaurantes, creando uno por defecto...');
      
      // Crear un restaurante por defecto
      const enlaceCompartido = 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      
      await query(`
        INSERT INTO restaurantes (nombre, descripcion, enlace_compartido, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'Restaurante Principal',
        'Restaurante por defecto del sistema',
        enlaceCompartido,
        currentDate,
        currentDate
      ]);
      
      console.log('Restaurante por defecto creado');
    }
    
    // Paso 8: Asignar todos los platos al primer restaurante si no tienen restaurante asignado
    console.log('Paso 8: Asignando platos a restaurantes...');
    const primerRestaurante = await query(`
      SELECT id FROM restaurantes ORDER BY id LIMIT 1
    `);
    
    if (primerRestaurante && primerRestaurante.length > 0) {
      const restauranteId = primerRestaurante[0].id;
      
      await query(`
        UPDATE platos 
        SET restaurante_id = ?
        WHERE restaurante_id IS NULL
      `, [restauranteId]);
      
      console.log(`Platos sin restaurante asignados al restaurante ID ${restauranteId}`);
    }
    
    // Paso 9: Asignar todas las reservas al primer restaurante si no tienen restaurante asignado
    console.log('Paso 9: Asignando reservas a restaurantes...');
    if (primerRestaurante && primerRestaurante.length > 0) {
      const restauranteId = primerRestaurante[0].id;
      
      await query(`
        UPDATE reservas 
        SET restaurante_id = ?
        WHERE restaurante_id IS NULL
      `, [restauranteId]);
      
      console.log(`Reservas sin restaurante asignadas al restaurante ID ${restauranteId}`);
    }
    
    console.log('Migración completada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
runManualMigration();
