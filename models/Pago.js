/**
 * Modelo para los pagos de la aplicación
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pago = sequelize.define('Pago', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    concepto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completado', 'rechazado', 'cancelado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    metodoPago: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    detalles: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'pagos',
    timestamps: true
  });

  return Pago;
};

