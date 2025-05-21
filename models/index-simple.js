const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

// Solo exportar lo mínimo necesario para que el servidor arranque
module.exports = {
  sequelize,
  Sequelize
}; 