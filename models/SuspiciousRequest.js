// Modelo para solicitudes sospechosas
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SuspiciousRequest = sequelize.define('SuspiciousRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    headers: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pattern: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Patrón de ataque detectado'
    },
    riskScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Puntuación de riesgo calculada'
    },
    wasBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si se bloqueó la solicitud'
    }
  }, {
    tableName: 'suspicious_requests',
    timestamps: true,
    indexes: [
      { fields: ['ip'] },
      { fields: ['pattern'] },
      { fields: ['createdAt'] }
    ]
  });

  return SuspiciousRequest;
};