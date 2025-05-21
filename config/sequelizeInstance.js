const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear una única instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'websap_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'azul123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize; 