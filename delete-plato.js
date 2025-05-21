// delete-plato.js
// Script para eliminar un plato directamente de la base de datos MySQL

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Función principal para eliminar un plato
async function deletePlato(platoId) {
  console.log(`Iniciando eliminación del plato con ID: ${platoId}`);
  
  // Configuración de la conexión a la base de datos
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'websap'
  };
  
  console.log('Configuración de conexión:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '******' : 'no configurada'
  });
  
  let connection;
  
  try {
    // Crear conexión
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión establecida');
    
    // Verificar si el plato existe
    console.log(`Verificando si el plato ID ${platoId} existe...`);
    const [rows] = await connection.query(
      'SELECT id, name FROM platos WHERE id = ?',
      [platoId]
    );
    
    if (rows.length === 0) {
      console.log(`Plato con ID ${platoId} no encontrado en la base de datos`);
      return false;
    }
    
    console.log(`Plato encontrado: ${rows[0].name} (ID: ${rows[0].id})`);
    
    // Eliminar el plato
    console.log(`Eliminando plato ID ${platoId}...`);
    const [result] = await connection.query(
      'DELETE FROM platos WHERE id = ?',
      [platoId]
    );
    
    console.log(`Resultado de la eliminación:`, result);
    
    if (result.affectedRows > 0) {
      console.log(`✅ Plato ID ${platoId} eliminado con éxito`);
      return true;
    } else {
      console.log(`❌ No se pudo eliminar el plato ID ${platoId}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al eliminar plato ID ${platoId}:`, error);
    return false;
  } finally {
    // Cerrar conexión
    if (connection) {
      console.log('Cerrando conexión...');
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Obtener el ID del plato de los argumentos de la línea de comandos
const platoId = process.argv[2];

if (!platoId) {
  console.error('❌ Error: Debe proporcionar el ID del plato a eliminar');
  console.log('Uso: node delete-plato.js ID_DEL_PLATO');
  process.exit(1);
}

// Ejecutar la función principal
deletePlato(platoId)
  .then(success => {
    if (success) {
      console.log('Operación completada con éxito');
      process.exit(0);
    } else {
      console.log('Operación completada con errores');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
