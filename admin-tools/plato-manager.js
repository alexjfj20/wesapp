// backend/admin-tools/plato-manager.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'websap'
};

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    return;
  }
  
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
    
    // Ejecutar el comando correspondiente
    switch (command) {
      case 'list':
        await listPlatos(connection);
        break;
      case 'delete':
        const platoId = args[1];
        if (!platoId) {
          console.error('❌ Error: Se requiere el ID del plato para eliminarlo');
          console.log('Uso: node plato-manager.js delete <ID_DEL_PLATO>');
          return;
        }
        await deletePlato(connection, platoId);
        break;
      case 'delete-all':
        await deleteAllPlatos(connection);
        break;
      case 'fix-duplicates':
        await fixDuplicatePlatos(connection);
        break;
      default:
        console.error(`❌ Comando desconocido: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar la conexión
    if (connection) {
      console.log('Cerrando conexión...');
      await connection.end();
      console.log('✅ Conexión cerrada');
    }
  }
}

// Mostrar ayuda
function showHelp() {
  console.log(`
=== Administrador de Platos WebSAP ===

Comandos disponibles:
  list                    - Listar todos los platos en la base de datos
  delete <ID_DEL_PLATO>   - Eliminar un plato por su ID
  delete-all              - Eliminar todos los platos (¡PELIGROSO!)
  fix-duplicates          - Buscar y eliminar platos duplicados

Ejemplos:
  node plato-manager.js list
  node plato-manager.js delete plato_1234567890
  node plato-manager.js fix-duplicates
  `);
}

// Listar todos los platos
async function listPlatos(connection) {
  console.log('Obteniendo lista de platos...');
  
  // Primero, obtengamos las columnas reales de la tabla platos
  const [columns] = await connection.execute(`
    SHOW COLUMNS FROM platos
  `);
  
  console.log('Estructura de la tabla platos:');
  columns.forEach(col => {
    console.log(`- ${col.Field} (${col.Type})`);
  });
  
  // Ahora consultamos los platos con las columnas que sabemos que existen
  const [rows] = await connection.execute(
    'SELECT id, name, price, created_at FROM platos ORDER BY created_at DESC'
  );
  
  if (rows.length === 0) {
    console.log('No hay platos en la base de datos');
    return;
  }
  
  console.log(`\n=== Platos en la base de datos (${rows.length}) ===\n`);
  
  rows.forEach((plato, index) => {
    console.log(`${index + 1}. ID: ${plato.id}`);
    console.log(`   Nombre: ${plato.name}`);
    console.log(`   Precio: $${plato.price || 'No especificado'}`);
    console.log(`   Creado: ${plato.created_at || 'No especificado'}`);
    
    // Mostrar todas las propiedades adicionales
    Object.keys(plato).forEach(key => {
      if (!['id', 'name', 'price', 'created_at'].includes(key)) {
        console.log(`   ${key}: ${plato[key]}`);
      }
    });
    
    console.log('');
  });
}

// Eliminar un plato por su ID
async function deletePlato(connection, platoId) {
  console.log(`Buscando plato con ID: ${platoId}`);
  
  // Verificar si el plato existe
  const [rows] = await connection.execute(
    'SELECT id, name FROM platos WHERE id = ?',
    [platoId]
  );
  
  if (rows.length === 0) {
    console.log(`❌ Plato con ID ${platoId} no encontrado`);
    return;
  }
  
  const plato = rows[0];
  console.log(`Plato encontrado: ${plato.name} (ID: ${plato.id})`);
  
  // Eliminar el plato
  console.log(`Eliminando plato...`);
  const [result] = await connection.execute(
    'DELETE FROM platos WHERE id = ?',
    [platoId]
  );
  
  if (result.affectedRows > 0) {
    console.log(`✅ Plato "${plato.name}" (ID: ${plato.id}) eliminado con éxito`);
  } else {
    console.log(`❌ No se pudo eliminar el plato`);
  }
}

// Eliminar todos los platos
async function deleteAllPlatos(connection) {
  console.log('⚠️ ADVERTENCIA: Estás a punto de eliminar TODOS los platos de la base de datos');
  console.log('Esta acción no se puede deshacer');
  
  // En un entorno real, aquí pediríamos confirmación al usuario
  // Pero como es un script, asumimos que el usuario sabe lo que hace
  
  console.log('Eliminando todos los platos...');
  const [result] = await connection.execute('DELETE FROM platos');
  
  console.log(`✅ ${result.affectedRows} platos eliminados de la base de datos`);
}

// Buscar y eliminar platos duplicados
async function fixDuplicatePlatos(connection) {
  console.log('Buscando platos duplicados por nombre...');
  
  // Encontrar nombres duplicados
  const [duplicateNames] = await connection.execute(`
    SELECT name, COUNT(*) as count
    FROM platos
    GROUP BY name
    HAVING COUNT(*) > 1
  `);
  
  if (duplicateNames.length === 0) {
    console.log('✅ No se encontraron platos con nombres duplicados');
    return;
  }
  
  console.log(`Encontrados ${duplicateNames.length} nombres de platos duplicados:`);
  
  // Para cada nombre duplicado
  for (const dup of duplicateNames) {
    console.log(`\nProcesando duplicados para: ${dup.name} (${dup.count} instancias)`);
    
    // Obtener todos los platos con ese nombre
    const [platos] = await connection.execute(
      'SELECT id, name, created_at FROM platos WHERE name = ? ORDER BY created_at DESC',
      [dup.name]
    );
    
    // Mantener el más reciente, eliminar los demás
    const platoToKeep = platos[0];
    const platosToDelete = platos.slice(1);
    
    console.log(`Manteniendo el plato más reciente: ${platoToKeep.id} (creado: ${platoToKeep.created_at})`);
    
    // Eliminar los duplicados
    for (const plato of platosToDelete) {
      console.log(`Eliminando duplicado: ${plato.id} (creado: ${plato.created_at})`);
      
      const [result] = await connection.execute(
        'DELETE FROM platos WHERE id = ?',
        [plato.id]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Plato duplicado ${plato.id} eliminado con éxito`);
      } else {
        console.log(`❌ No se pudo eliminar el plato duplicado ${plato.id}`);
      }
    }
  }
  
  console.log('\n✅ Proceso de limpieza de duplicados completado');
}

// Ejecutar la función principal
main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
