// backend/models/Plato.js

/**
 * Modelo para los platos del restaurante
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plato = sequelize.define('Plato', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'platos',
    timestamps: true
  });

  return Plato;
};