/**
 * Modelo para los mensajes del sistema
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mensaje = sequelize.define('Mensaje', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    remitente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    destinatario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    asunto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    fechaEnvio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fechaLectura: {
      type: DataTypes.DATE,
      allowNull: true
    },
    eliminadoRemitente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    eliminadoDestinatario: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'mensajes',
    timestamps: true
  });

  return Mensaje;
};

