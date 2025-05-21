// backend/scripts/testImageSync.js

const { Plato, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

// Función para convertir una imagen a base64
function imageToBase64(filePath) {
  try {
    // Leer el archivo
    const imageBuffer = fs.readFileSync(filePath);
    // Convertir a base64
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error al convertir imagen a base64:', error);
    return null;
  }
}

// Función para probar la sincronización de imágenes
async function testImageSync() {
  try {
    console.log('Iniciando prueba de sincronización de imágenes...');
    
    // Obtener todos los platos
    const platos = await Plato.findAll();
    console.log(`Se encontraron ${platos.length} platos en la base de datos`);
    
    if (platos.length === 0) {
      console.log('No hay platos en la base de datos para actualizar');
      return;
    }
    
    // Directorio de imágenes de ejemplo
    const imageDir = path.join(__dirname, '../public/images');
    
    // Verificar si el directorio existe
    if (!fs.existsSync(imageDir)) {
      console.log(`Creando directorio de imágenes: ${imageDir}`);
      fs.mkdirSync(imageDir, { recursive: true });
    }
    
    // Crear una imagen de ejemplo si no existe
    const sampleImagePath = path.join(imageDir, 'sample_food.jpg');
    if (!fs.existsSync(sampleImagePath)) {
      console.log('No se encontró la imagen de ejemplo. Usando una imagen predeterminada.');
      
      // Usar una imagen de un plato específico según su nombre
      for (const plato of platos) {
        console.log(`Actualizando plato: ${plato.name}`);
        
        // Convertir el nombre del plato a un formato válido para nombre de archivo
        const fileName = plato.name.toLowerCase()
          .replace(/[áäâà]/g, 'a')
          .replace(/[éëêè]/g, 'e')
          .replace(/[íïîì]/g, 'i')
          .replace(/[óöôò]/g, 'o')
          .replace(/[úüûù]/g, 'u')
          .replace(/ñ/g, 'n')
          .replace(/[^a-z0-9]/g, '_') + '.jpg';
        
        // Ruta completa de la imagen
        const imagePath = path.join(imageDir, fileName);
        
        // Verificar si la imagen existe
        if (fs.existsSync(imagePath)) {
          // Convertir la imagen a base64
          const imageBase64 = imageToBase64(imagePath);
          
          if (imageBase64) {
            // Actualizar el plato con la imagen
            await plato.update({ image: imageBase64 });
            console.log(`Plato "${plato.name}" actualizado con imagen ${fileName}`);
          } else {
            console.log(`No se pudo convertir la imagen ${fileName} a base64`);
          }
        } else {
          console.log(`No se encontró una imagen específica para "${plato.name}"`);
          
          // Usar una imagen genérica según la categoría o el tipo de plato
          // Aquí podrías implementar lógica para asignar imágenes según categorías
        }
      }
    } else {
      // Usar la imagen de ejemplo para todos los platos
      const imageBase64 = imageToBase64(sampleImagePath);
      
      if (imageBase64) {
        // Actualizar todos los platos con la misma imagen
        for (const plato of platos) {
          await plato.update({ image: imageBase64 });
          console.log(`Plato "${plato.name}" actualizado con imagen de ejemplo`);
        }
      } else {
        console.log('No se pudo convertir la imagen de ejemplo a base64');
      }
    }
    
    console.log('Prueba de sincronización de imágenes completada');
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error en la prueba de sincronización de imágenes:', error);
  }
}

// Ejecutar la función
testImageSync();
