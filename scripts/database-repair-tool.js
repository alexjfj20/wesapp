/**
 * Script integral para diagnosticar y reparar problemas de conexión a la base de datos
 * Ejecutar con: node scripts/database-repair-tool.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const { checkDatabaseConnection, repairDatabaseConnection } = require('../utils/dbConnectionManager');

// Banner
console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║       WebSAP - Herramienta de Diagnóstico    ║
║       y Reparación de Base de Datos          ║
║                                              ║
╚══════════════════════════════════════════════╝
`);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'websap',
  port: process.env.DB_PORT || 3306
};

/**
 * Diagnóstico y reparación principal
 */
async function diagnoseAndRepair() {
  try {
    console.log('🔄 Iniciando diagnóstico completo del sistema de base de datos...');
    
    // Paso 1: Verificar archivo .env
    await checkEnvFile();
    
    // Paso 2: Verificar existencia de la base de datos
    await checkAndCreateDatabaseIfNeeded();
    
    // Paso 3: Verificar estructura de modelos
    await checkModelsStructure();
    
    // Paso 4: Verificar conexiones a la base de datos
    await verifyAllConnections();
    
    console.log('\n✅ Diagnóstico y reparación completados exitosamente.');
    return true;
  } catch (error) {
    console.error(`\n❌ Error durante el diagnóstico: ${error.message}`);
    return false;
  }
}

/**
 * Verifica y repara el archivo .env
 */
async function checkEnvFile() {
  console.log('\n📋 Paso 1: Verificando archivo .env...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  // Verificar existencia del archivo
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ No se encontró archivo .env. Creando uno nuevo...');
    
    // Crear archivo .env con valores predeterminados
    const envContent = `
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=websap
DB_PORT=3306

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Sincronización
SYNC_ENABLED=true
SYNC_INTERVAL=30000
`;
    
    fs.writeFileSync(envPath, envContent.trim());
    console.log('✅ Archivo .env creado exitosamente.');
  } else {
    console.log('✅ Archivo .env existe.');
    
    // Leer contenido actual
    let envContent = fs.readFileSync(envPath, 'utf8');
    let modified = false;
    
    // Verificar variables de entorno necesarias
    const requiredVars = [
      { name: 'DB_HOST', value: 'localhost' },
      { name: 'DB_USER', value: 'root' },
      { name: 'DB_NAME', value: 'websap' },
      { name: 'DB_PORT', value: '3306' }
    ];
    
    requiredVars.forEach(v => {
      // Comprobar si la variable existe
      if (!envContent.includes(`${v.name}=`)) {
        console.log(`⚠️ Variable ${v.name} no encontrada. Agregando...`);
        envContent += `\n${v.name}=${v.value}`;
        modified = true;
      }
    });
    
    // Guardar cambios si es necesario
    if (modified) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Archivo .env actualizado con variables faltantes.');
    } else {
      console.log('✅ Archivo .env contiene todas las variables necesarias.');
    }
  }
  
  // Re-cargar variables de entorno
  require('dotenv').config();
  return true;
}

/**
 * Verifica y crea la base de datos si es necesario
 */
async function checkAndCreateDatabaseIfNeeded() {
  console.log('\n📋 Paso 2: Verificando base de datos...');
  
  try {
    // Conectar sin seleccionar una base de datos específica
    console.log('🔄 Conectando a MySQL...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    // Verificar si la base de datos existe
    console.log(`🔄 Verificando existencia de la base de datos '${dbConfig.database}'...`);
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );
    
    if (rows.length === 0) {
      console.log(`⚠️ Base de datos '${dbConfig.database}' no existe. Creando...`);
      
      // Crear base de datos
      await connection.query(
        `CREATE DATABASE \`${dbConfig.database}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      
      console.log(`✅ Base de datos '${dbConfig.database}' creada exitosamente.`);
    } else {
      console.log(`✅ Base de datos '${dbConfig.database}' existe.`);
    }
    
    // Cerrar conexión
    await connection.end();
    return true;
  } catch (error) {
    console.error(`❌ Error al verificar/crear la base de datos: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica y corrige la estructura de los modelos
 */
async function checkModelsStructure() {
  console.log('\n📋 Paso 3: Verificando estructura de modelos...');
  
  const modelsDir = path.join(__dirname, '..', 'models');
  const indexPath = path.join(modelsDir, 'index.js');
  
  // Verificar index.js
  if (!fs.existsSync(indexPath)) {
    console.error('❌ No se encontró el archivo models/index.js.');
    return false;
  }
  
  // Leer contenido actual
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  let modified = false;
  
  // Verificar importación de sequelize
  if (!indexContent.includes('const { Sequelize, DataTypes } = require(\'sequelize\');')) {
    console.log('⚠️ Corrigiendo importación de Sequelize en index.js...');
    
    // Reemplazar importación
    indexContent = indexContent.replace(
      /const\s*\{\s*Sequelize\s*\}\s*=\s*require\(['"]sequelize['"]\);/,
      'const { Sequelize, DataTypes } = require(\'sequelize\');'
    );
    
    modified = true;
  }
  
  // Verificar exportación de DataTypes
  if (!indexContent.includes('DataTypes,')) {
    console.log('⚠️ Corrigiendo exportación de DataTypes en index.js...');
    
    // Agregar DataTypes a la exportación
    indexContent = indexContent.replace(
      'module.exports = {',
      'module.exports = {\n  DataTypes,'
    );
    
    modified = true;
  }
  
  // Guardar cambios si es necesario
  if (modified) {
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Archivo models/index.js actualizado correctamente.');
  } else {
    console.log('✅ Archivo models/index.js está configurado correctamente.');
  }
  
  // Verificar archivos de modelos
  const modelFiles = fs.readdirSync(modelsDir).filter(file => {
    return file !== 'index.js' && file !== 'index-simple.js' && file.endsWith('.js');
  });
  
  console.log(`🔄 Verificando ${modelFiles.length} archivos de modelos...`);
  
  // Arreglar archivos de modelos con DataTypes
  let fixedFiles = 0;
  modelFiles.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar problemas comunes
    let needsUpdate = false;
    let updatedContent = content;
    
    // Problema 1: Comentario indicando que DataTypes se obtiene de index.js pero sin importación
    if (content.includes('// DataTypes se obtiene ahora de models/index.js') && !content.includes('const { DataTypes }')) {
      updatedContent = updatedContent.replace(
        '// DataTypes se obtiene ahora de models/index.js',
        '// Importar DataTypes directamente\nconst { DataTypes } = require(\'sequelize\');'
      );
      needsUpdate = true;
    }
    
    // Problema 2: sequelize() usado como función
    if (content.includes('sequelize().define')) {
      updatedContent = updatedContent.replace(
        'sequelize().define',
        'sequelize.define'
      );
      needsUpdate = true;
    }
    
    // Guardar cambios si es necesario
    if (needsUpdate) {
      fs.writeFileSync(filePath, updatedContent);
      fixedFiles++;
    }
  });
  
  if (fixedFiles > 0) {
    console.log(`✅ Se corrigieron ${fixedFiles} archivos de modelos.`);
  } else {
    console.log('✅ Todos los archivos de modelos están correctamente configurados.');
  }
  
  return true;
}

/**
 * Verifica todas las conexiones a la base de datos
 */
async function verifyAllConnections() {
  console.log('\n📋 Paso 4: Verificando conexiones a la base de datos...');
  
  try {
    // Verificar conexión directa con MySQL
    console.log('🔄 Probando conexión directa con MySQL...');
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    const [rows] = await conn.query('SELECT 1+1 as result');
    console.log(`✅ Conexión directa exitosa: ${rows[0].result}`);
    await conn.end();
    
    // Verificar conexión con utilidad de dbConnectionManager
    console.log('\n🔄 Verificando conexión mediante dbConnectionManager...');
    const status = await checkDatabaseConnection();
    
    console.log(`${status.success ? '✅' : '❌'} Estado general: ${status.success ? 'Operativo' : 'Con problemas'}`);
    console.log(`${status.sequelizeConnected ? '✅' : '❌'} Sequelize: ${status.sequelizeConnected ? 'Conectado' : 'Desconectado'}`);
    console.log(`${status.poolConnected ? '✅' : '❌'} Pool MySQL: ${status.poolConnected ? 'Conectado' : 'Desconectado'}`);
    
    // Si hay problemas, intentar reparar
    if (!status.success) {
      console.log('\n⚠️ Se detectaron problemas en las conexiones. Intentando reparación...');
      
      const repair = await repairDatabaseConnection();
      
      // Verificar resultado después de la reparación
      const finalStatus = await checkDatabaseConnection();
      
      if (finalStatus.success) {
        console.log('✅ Reparación exitosa. Todas las conexiones funcionan correctamente.');
      } else {
        console.log('⚠️ La reparación automática no resolvió todos los problemas.');
        
        // Mostrar recomendaciones específicas
        if (!finalStatus.sequelizeConnected) {
          console.log('   - Revisar configuración de Sequelize en config/database.js');
        }
        
        if (!finalStatus.poolConnected) {
          console.log('   - Revisar configuración del pool en config/dbPool.js');
        }
      }
    }
    
    return status.success;
  } catch (error) {
    console.error(`❌ Error durante la verificación de conexiones: ${error.message}`);
    throw error;
  }
}

// Ejecutar diagnóstico completo
diagnoseAndRepair()
  .then(success => {
    if (success) {
      console.log('\n✅ Proceso completado exitosamente.');
    } else {
      console.error('\n⚠️ El proceso encontró problemas que no pudieron ser resueltos automáticamente.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error fatal durante el proceso:', error.message);
    process.exit(1);
  });
