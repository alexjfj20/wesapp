const { query, closePool } = require('../config/dbPool');

async function initReservasTable() {
  try {
    console.log('🔧 Inicializando tabla de reservas...');
    
    // Verificar si la tabla ya existe
    const tables = await query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = 'reservas'",
      [process.env.DB_NAME || 'websap']
    );
    
    const tablaExiste = tables.some(t => (t.table_name || t.TABLE_NAME) === 'reservas');
    
    if (tablaExiste) {
      console.log('✅ Tabla de reservas ya existe');
    } else {
      // Crear la tabla de reservas
      await query(`
        CREATE TABLE reservas (
          id VARCHAR(255) PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          telefono VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          fecha DATE NOT NULL,
          hora TIME NOT NULL,
          personas INT DEFAULT 2,
          notas TEXT,
          estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
          origen VARCHAR(50) DEFAULT 'web',
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabla de reservas creada correctamente');
    }
    
    // Cerrar el pool de conexiones
    await closePool();
    console.log('✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error al inicializar tabla de reservas:', error);
    await closePool();
    process.exit(1);
  }
}

// Ejecutar la función
initReservasTable();
