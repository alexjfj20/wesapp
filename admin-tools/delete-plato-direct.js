// backend/admin-tools/delete-plato-direct.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'websap'
};

// Función para eliminar un plato directamente de la base de datos MySQL
async function deletePlatoDirectly(platoId) {
  if (!platoId) {
    console.error('❌ Error: Se requiere el ID del plato');
    console.log('Uso: node delete-plato-direct.js <ID_DEL_PLATO>');
    return;
  }
  
  console.log(`Iniciando eliminación directa del plato con ID: ${platoId}`);
  
  let connection;
  
  try {
    // Crear conexión a MySQL
    console.log('Configuración de conexión:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: '******' // Ocultamos la contraseña por seguridad
    });
    
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');
    
    // Verificar si el plato existe
    console.log(`Verificando si el plato ID ${platoId} existe...`);
    const [rows] = await connection.execute(
      'SELECT id, name FROM platos WHERE id = ?',
      [platoId]
    );
    
    if (rows.length === 0) {
      console.log(`❌ Plato ID ${platoId} no encontrado en la base de datos MySQL`);
      return;
    }
    
    const plato = rows[0];
    console.log(`Plato encontrado: ${plato.name} (ID: ${plato.id})`);
    
    // Eliminar el plato
    console.log(`Eliminando plato ID ${platoId} de la base de datos MySQL...`);
    const [result] = await connection.execute(
      'DELETE FROM platos WHERE id = ?',
      [platoId]
    );
    
    console.log('Resultado de la eliminación:', result);
    
    if (result.affectedRows > 0) {
      console.log(`✅ Plato ID ${platoId} eliminado con éxito de la base de datos MySQL`);
      return true;
    } else {
      console.log(`❌ No se pudo eliminar el plato ID ${platoId} de la base de datos MySQL`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al eliminar plato:', error);
    return false;
  } finally {
    // Cerrar la conexión
    if (connection) {
      console.log('Cerrando conexión...');
      await connection.end();
      console.log('Conexión cerrada');
    }
    console.log('Operación completada');
  }
}

// Ejecutar la función principal
async function main() {
  const platoId = process.argv[2];
  
  if (!platoId) {
    console.error('❌ Error: Se requiere el ID del plato');
    console.log('Uso: node delete-plato-direct.js <ID_DEL_PLATO>');
    return;
  }
  
  const success = await deletePlatoDirectly(platoId);
  
  if (success) {
    console.log(`\n✅ ÉXITO: El plato con ID ${platoId} ha sido eliminado correctamente de la base de datos MySQL`);
  } else {
    console.log(`\n❌ ERROR: No se pudo eliminar el plato con ID ${platoId} de la base de datos MySQL`);
  }
}

// Si este script se ejecuta directamente (no se importa)
if (require.main === module) {
  main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}

// Exportar la función para usarla en otros scripts
module.exports = { deletePlatoDirectly };
