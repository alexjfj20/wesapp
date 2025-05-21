const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Obtener configuración de la base de datos
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'websap';
const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

// Función para crear la base de datos
async function createDatabase() {
  console.log('🔄 Iniciando creación de base de datos...');
  console.log(`- Host: ${dbHost}`);
  console.log(`- Usuario: ${dbUser}`);
  console.log(`- Base de datos a crear: ${dbName}`);
  
  try {
    // Conectar a MySQL sin especificar una base de datos
    console.log('🔄 Conectando a MySQL...');
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });
    
    // Crear la base de datos si no existe
    console.log(`🔄 Creando base de datos '${dbName}' si no existe...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    
    // Verificar que la base de datos existe
    console.log('🔄 Verificando creación de la base de datos...');
    const [databases] = await connection.query('SHOW DATABASES');
    const databaseExists = databases.some(db => db.Database === dbName);
    
    if (databaseExists) {
      console.log(`✅ Base de datos '${dbName}' creada/verificada correctamente.`);
      
      // Seleccionar la base de datos
      await connection.query(`USE ${dbName}`);
      
      // Crear tablas básicas si es necesario
      console.log('🔄 Verificando tablas requeridas...');
      // Puedes agregar aquí la creación de tablas básicas si lo necesitas
      
      console.log('✅ Base de datos lista para usar.');
    } else {
      console.error(`❌ No se pudo verificar la creación de la base de datos '${dbName}'.`);
    }
    
    // Cerrar la conexión
    await connection.end();
    return databaseExists;
  } catch (error) {
    console.error('❌ Error al crear/verificar la base de datos:', error);
    return false;
  }
}

// Ejecutar la función si se ejecuta directamente este script
if (require.main === module) {
  createDatabase()
    .then(success => {
      if (success) {
        console.log('✅ El script se ejecutó correctamente.');
        process.exit(0);
      } else {
        console.error('❌ El script falló.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { createDatabase };
