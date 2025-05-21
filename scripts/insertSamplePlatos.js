// backend/scripts/insertSamplePlatos.js

const { Plato, sequelize } = require('../models');

// Platos de ejemplo
const samplePlatos = [
  {
    name: 'Hamburguesa Clásica',
    description: 'Deliciosa hamburguesa con carne de res, lechuga, tomate y queso',
    price: 12.99,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Pizza Margherita',
    description: 'Pizza tradicional italiana con tomate, mozzarella y albahaca',
    price: 14.50,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, queso parmesano y aderezo César',
    price: 8.99,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Pasta Carbonara',
    description: 'Espagueti con salsa cremosa, huevo, panceta y queso parmesano',
    price: 13.75,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Salmón a la Parrilla',
    description: 'Filete de salmón a la parrilla con limón y hierbas',
    price: 18.50,
    category: 'special',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Tacos de Carnitas',
    description: 'Tres tacos de carnitas con cebolla, cilantro y salsa verde',
    price: 10.99,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Risotto de Champiñones',
    description: 'Risotto cremoso con champiñones y queso parmesano',
    price: 15.25,
    category: 'special',
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Pollo al Curry',
    description: 'Pollo en salsa de curry con arroz basmati',
    price: 14.99,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Tiramisú',
    description: 'Postre italiano clásico con café, mascarpone y cacao',
    price: 7.50,
    category: 'special',
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  },
  {
    name: 'Limonada Casera',
    description: 'Refrescante limonada hecha con limones frescos y menta',
    price: 3.99,
    category: 'regular',
    image_url: 'https://images.unsplash.com/photo-1556679343-c1c1c9308a4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true
  }
];

// Función para insertar los platos
async function insertSamplePlatos() {
  try {
    console.log('Verificando si la tabla menu_items existe...');
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'menu_items'");
    
    if (tables.length === 0) {
      console.log('La tabla menu_items no existe. Creando tabla...');
      await sequelize.query(`
        CREATE TABLE menu_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price FLOAT NOT NULL,
          category VARCHAR(50),
          image_url VARCHAR(255),
          is_available BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla menu_items creada correctamente');
    } else {
      console.log('Tabla menu_items ya existe');
    }
    
    // Verificar si ya hay platos en la tabla
    const [existingPlatos] = await sequelize.query("SELECT COUNT(*) as count FROM menu_items");
    const count = existingPlatos[0].count;
    
    if (count > 0) {
      console.log(`Ya existen ${count} platos en la base de datos`);
      console.log('¿Desea eliminar los platos existentes e insertar los nuevos? (s/n)');
      // En un script real, aquí se esperaría la respuesta del usuario
      // Para este ejemplo, asumimos que sí
      console.log('Eliminando platos existentes...');
      await sequelize.query("TRUNCATE TABLE menu_items");
    }
    
    console.log('Insertando platos de ejemplo...');
    
    // Insertar los platos uno por uno
    for (const plato of samplePlatos) {
      await Plato.create(plato);
      console.log(`Plato "${plato.name}" insertado correctamente`);
    }
    
    console.log('Todos los platos han sido insertados correctamente');
    
    // Verificar que los platos se hayan insertado
    const [insertedPlatos] = await sequelize.query("SELECT * FROM menu_items");
    console.log(`Se han insertado ${insertedPlatos.length} platos en la base de datos`);
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error al insertar platos de ejemplo:', error);
  }
}

// Ejecutar la función
insertSamplePlatos();
