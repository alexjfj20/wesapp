/**
 * Modelo para los respaldos de datos del sistema
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RespaldoDatos = sequelize.define('RespaldoDatos', {
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
    ruta: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('completo', 'parcial', 'configuracion'),
      allowNull: false,
      defaultValue: 'completo'
    },
    tamano: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Tamaño en KB'
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    estado: {
      type: DataTypes.ENUM('completo', 'en_progreso', 'fallido'),
      allowNull: false,
      defaultValue: 'completo'
    }
  }, {
    tableName: 'respaldo_datos',
    timestamps: true
  });

  return RespaldoDatos;
};

