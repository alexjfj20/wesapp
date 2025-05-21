// backend/scripts/updatePlatosWithImages.js

const { Plato, sequelize } = require('../models');

// Imágenes de ejemplo para los platos
const sampleImages = [
  {
    name: "Hamburguesa",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Ensalada",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Pasta",
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Salmón",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Tacos",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Risotto",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Pollo",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Postre",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Bebida",
    image: "https://images.unsplash.com/photo-1556679343-c1c1c9308a4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  }
];

// Función para actualizar los platos con imágenes
async function updatePlatosWithImages() {
  try {
    console.log('Obteniendo todos los platos...');
    const platos = await Plato.findAll();
    
    if (!platos || platos.length === 0) {
      console.log('No se encontraron platos en la base de datos');
      return;
    }
    
    console.log(`Se encontraron ${platos.length} platos`);
    
    // Actualizar cada plato con una imagen según su nombre
    for (const plato of platos) {
      // Buscar una imagen que coincida con el nombre del plato
      let imageUrl = null;
      
      for (const sample of sampleImages) {
        if (plato.name.toLowerCase().includes(sample.name.toLowerCase())) {
          imageUrl = sample.image;
          break;
        }
      }
      
      // Si no se encontró una coincidencia, usar una imagen aleatoria
      if (!imageUrl) {
        const randomIndex = Math.floor(Math.random() * sampleImages.length);
        imageUrl = sampleImages[randomIndex].image;
      }
      
      // Actualizar el plato con la imagen
      await plato.update({ image: imageUrl });
      console.log(`Plato "${plato.name}" actualizado con imagen`);
    }
    
    console.log('Todos los platos han sido actualizados con imágenes');
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error al actualizar platos con imágenes:', error);
  }
}

// Ejecutar la función
updatePlatosWithImages();
