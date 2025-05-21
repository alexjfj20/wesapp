// Modelo para reglas de seguridad personalizadas
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SecurityRule = sequelize.define('SecurityRule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    pattern: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Patrón a detectar (URL, User-Agent, etc.)'
    },
    patternType: {
      type: DataTypes.ENUM('url', 'userAgent', 'ip', 'header', 'queryParam'),
      allowNull: false,
      defaultValue: 'url'
    },
    action: {
      type: DataTypes.ENUM('block', 'challenge', 'log', 'redirect'),
      allowNull: false,
      defaultValue: 'log'
    },
    redirectTo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL de redirección si action es redirect'
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      comment: 'Puntuación de riesgo entre 0-100'
    },
    isRegex: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si el patrón es una expresión regular'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del usuario que actualizó la regla'
    }
  }, {
    tableName: 'security_rules',
    timestamps: true,
    indexes: [
      { fields: ['patternType'] },
      { fields: ['isActive'] },
      { fields: ['action'] }
    ]
  });

  return SecurityRule;
};