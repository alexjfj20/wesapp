// Métodos temporales para elementos del menú e inventario

// Obtener elementos del menú (para panel de inventario)
exports.getMenuItems = async (req, res) => {
  try {
    // Crear lista de ejemplo de elementos del menú
    const menuItems = [
      {
        id: 1,
        nombre: 'Hamburguesa',
        descripcion: 'Deliciosa hamburguesa con carne 100% de res',
        precio: 15000,
        categoria: 'Platos principales',
        disponible: true,
        imagen: '/img/hamburguesa.jpg',
        availableQuantity: 45
      },
      {
        id: 2,
        nombre: 'Pizza',
        descripcion: 'Pizza italiana con queso y pepperoni',
        precio: 25000,
        categoria: 'Platos principales',
        disponible: true,
        imagen: '/img/pizza.jpg',
        availableQuantity: 30
      },
      {
        id: 3,
        nombre: 'Ensalada César',
        descripcion: 'Ensalada fresca con pollo, queso parmesano y aderezo César',
        precio: 12000,
        categoria: 'Entradas',
        disponible: true,
        imagen: '/img/ensalada.jpg',
        availableQuantity: 20
      }
    ];
    
    return res.status(200).json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Error al obtener elementos del menú:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener elementos del menú',
      error: error.message,
      data: [] // Siempre devolver un array vacío en caso de error
    });
  }
};
