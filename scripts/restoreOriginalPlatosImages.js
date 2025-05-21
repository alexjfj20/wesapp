// backend/scripts/restoreOriginalPlatosImages.js

const { Plato, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Función para obtener una imagen desde una URL
async function getImageFromUrl(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'];
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error al obtener imagen desde URL ${url}:`, error.message);
    return null;
  }
}

// Función para restaurar las imágenes originales de los platos
async function restoreOriginalPlatosImages() {
  try {
    console.log('Iniciando restauración de imágenes originales de platos...');
    
    // Obtener todos los platos
    const platos = await Plato.findAll();
    console.log(`Se encontraron ${platos.length} platos en la base de datos`);
    
    if (platos.length === 0) {
      console.log('No hay platos en la base de datos para actualizar');
      return;
    }
    
    // Mapeo de nombres de platos a URLs de imágenes
    const platoImageMap = {
      'Risotto de Champiñones': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=2670&auto=format&fit=crop',
      'Moussaka': 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=2574&auto=format&fit=crop',
      'Feijoada': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=2672&auto=format&fit=crop',
      'Biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=2670&auto=format&fit=crop',
      'Sushi Nigiri': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2670&auto=format&fit=crop',
      'Cochinita Pibil': 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?q=80&w=2680&auto=format&fit=crop',
      'Pad Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=2670&auto=format&fit=crop',
      'Shawarma': 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?q=80&w=2670&auto=format&fit=crop',
      'Sauerbraten': 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2649&auto=format&fit=crop',
      'Goulash': 'https://images.unsplash.com/photo-1514516816566-de580c621376?q=80&w=2574&auto=format&fit=crop'
    };
    
    // Imágenes genéricas para platos que no tienen una imagen específica
    const genericFoodImages = [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=2674&auto=format&fit=crop'
    ];
    
    // Procesar cada plato
    for (const plato of platos) {
      console.log(`Procesando plato: ${plato.name}`);
      
      // Buscar una imagen específica para este plato
      let imageUrl = platoImageMap[plato.name];
      
      // Si no hay una imagen específica, usar una genérica
      if (!imageUrl) {
        const randomIndex = Math.floor(Math.random() * genericFoodImages.length);
        imageUrl = genericFoodImages[randomIndex];
        console.log(`Usando imagen genérica para "${plato.name}": ${imageUrl}`);
      } else {
        console.log(`Usando imagen específica para "${plato.name}": ${imageUrl}`);
      }
      
      // Obtener la imagen en formato base64
      const imageBase64 = await getImageFromUrl(imageUrl);
      
      if (imageBase64) {
        // Actualizar el plato con la imagen
        await plato.update({ image: imageBase64 });
        console.log(`Plato "${plato.name}" actualizado con imagen`);
      } else {
        console.log(`No se pudo obtener la imagen para "${plato.name}"`);
      }
    }
    
    console.log('Restauración de imágenes originales completada');
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error en la restauración de imágenes originales:', error);
  }
}

// Ejecutar la función
restoreOriginalPlatosImages();
