/**
 * Modelo para los respaldos de datos
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RespaldoDato = sequelize.define('RespaldoDato', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ruta: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING,
      defaultValue: 'completo'
    }
  }, {
    tableName: 'respaldo_datos',
    timestamps: true
  });

  return RespaldoDato;
};

