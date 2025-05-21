// Modelo para IPs bloqueadas
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlockedIP = sequelize.define('BlockedIP', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    blockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de expiración del bloqueo, null significa permanente'
    },
    blockedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del usuario que bloqueó la IP'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Estado del bloqueo'
    }
  }, {
    tableName: 'blocked_ips',
    timestamps: true,
    indexes: [
      { fields: ['ip'], unique: true },
      { fields: ['expiresAt'] },
      { fields: ['isActive'] }
    ]
  });

  return BlockedIP;
};