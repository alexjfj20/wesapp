/**
 * Modelo base para usar como template
 * Este modelo sirve como referencia para crear nuevos modelos
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NombreModelo = sequelize.define('NombreModelo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'nombre_modelos',
    timestamps: true // Habilita createdAt y updatedAt
  });

  return NombreModelo;
};