// backend/scripts/restoreOriginalImages.js

const { Plato, sequelize } = require('../models');

// Función para restaurar las imágenes originales
async function restoreOriginalImages() {
  try {
    console.log('Verificando si hay una copia de seguridad de las imágenes...');
    
    // Primero verificamos si existe una tabla de respaldo
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'platos_backup'");
    
    if (tables.length > 0) {
      console.log('Se encontró una tabla de respaldo. Restaurando imágenes desde la copia de seguridad...');
      
      // Restaurar desde la copia de seguridad
      await sequelize.query(`
        UPDATE platos p
        JOIN platos_backup pb ON p.id = pb.id
        SET p.image = pb.image
        WHERE pb.image IS NOT NULL
      `);
      
      console.log('Imágenes restauradas desde la copia de seguridad');
    } else {
      console.log('No se encontró una tabla de respaldo. Intentando restaurar de otra manera...');
      
      // Si no hay copia de seguridad, intentamos otra estrategia
      // Podemos intentar buscar las imágenes en IndexedDB o en archivos locales
      
      // Por ahora, simplemente establecemos las imágenes a NULL para que el sistema
      // pueda mostrar los placeholders o las imágenes que estén en IndexedDB
      await sequelize.query(`
        UPDATE platos
        SET image = NULL
      `);
      
      console.log('Se han restablecido las imágenes a NULL. El sistema utilizará las imágenes de IndexedDB si están disponibles.');
    }
    
    console.log('Proceso de restauración completado');
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error al restaurar las imágenes originales:', error);
  }
}

// Ejecutar la función
restoreOriginalImages();
