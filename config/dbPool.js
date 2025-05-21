/**
 * Configuración del pool de conexiones a la base de datos
 */
const { Sequelize } = require('sequelize');
const dbConfig = require('./database')[process.env.NODE_ENV || 'development'];

// Pool de conexiones
let pool = null;

/**
 * Inicializa el pool de conexiones
 */
function initPool() {
  if (pool) {
    console.log('Pool de conexiones ya inicializado');
    return pool;
  }
  
  console.log('Inicializando pool de conexiones...');
  
  try {
    if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
      pool = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
    } else if (dbConfig.url) {
      pool = new Sequelize(dbConfig.url, dbConfig);
    } else {
      pool = new Sequelize(
        dbConfig.database || 'websap',
        dbConfig.username || 'root',
        dbConfig.password || '',
        dbConfig
      );
    }
    
    console.log('Pool de conexiones inicializado correctamente');
    return pool;
  } catch (error) {
    console.error('Error al inicializar el pool de conexiones:', error);
    throw error;
  }
}

/**
 * Cierra el pool de conexiones
 */
async function closePool() {
  if (!pool) {
    console.log('No hay pool de conexiones para cerrar');
    return;
  }
  
  try {
    await pool.close();
    pool = null;
    console.log('Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('Error al cerrar el pool de conexiones:', error);
    throw error;
  }
}

/**
 * Obtiene el pool de conexiones o lo inicializa si no existe
 */
function getPool() {
  if (!pool) {
    return initPool();
  }
  return pool;
}

module.exports = {
  initPool,
  closePool,
  getPool
};
