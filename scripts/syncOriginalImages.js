// backend/scripts/syncOriginalImages.js

const { Plato, sequelize } = require('../models');
const axios = require('axios');

// Función para sincronizar las imágenes originales desde IndexedDB a MySQL
async function syncOriginalImages() {
  try {
    console.log('Iniciando sincronización de imágenes originales...');
    
    // 1. Obtener todos los platos de MySQL
    const platos = await Plato.findAll();
    console.log(`Se encontraron ${platos.length} platos en la base de datos MySQL`);
    
    if (platos.length === 0) {
      console.log('No hay platos en la base de datos para actualizar');
      return;
    }
    
    // 2. Obtener datos de IndexedDB a través de una API especial
    console.log('Obteniendo datos de IndexedDB...');
    try {
      const response = await axios.get('http://localhost:3000/api/indexeddb/platos');
      
      if (response.data && response.data.success && response.data.data) {
        const indexedDBPlatos = response.data.data;
        console.log(`Se encontraron ${indexedDBPlatos.length} platos en IndexedDB`);
        
        // 3. Actualizar cada plato en MySQL con su imagen original de IndexedDB
        let actualizados = 0;
        
        for (const platoMySQL of platos) {
          // Buscar el plato correspondiente en IndexedDB
          const platoIndexedDB = indexedDBPlatos.find(p => p.id === platoMySQL.id);
          
          if (platoIndexedDB && platoIndexedDB.image) {
            console.log(`Actualizando plato "${platoMySQL.name}" con imagen original de IndexedDB`);
            
            // Actualizar el plato en MySQL con la imagen de IndexedDB
            await platoMySQL.update({ 
              image: platoIndexedDB.image,
              updated_at: new Date()
            });
            
            actualizados++;
          } else {
            console.log(`No se encontró imagen original para el plato "${platoMySQL.name}" en IndexedDB`);
          }
        }
        
        console.log(`Sincronización completada. ${actualizados} platos actualizados con imágenes originales.`);
      } else {
        console.log('No se pudieron obtener los platos de IndexedDB');
      }
    } catch (error) {
      console.error('Error al obtener datos de IndexedDB:', error.message);
    }
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error en la sincronización de imágenes originales:', error);
  }
}

// Ejecutar la función
syncOriginalImages();
