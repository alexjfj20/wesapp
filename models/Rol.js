/**
 * Modelo para los roles de usuario
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rol = sequelize.define('Rol', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permisos: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const permisosText = this.getDataValue('permisos');
        return permisosText ? JSON.parse(permisosText) : [];
      },
      set(value) {
        this.setDataValue('permisos', JSON.stringify(value));
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    esDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    nivelAcceso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Nivel de acceso: 1 (básico) a 10 (administrador)'
    }
  }, {
    tableName: 'roles',
    timestamps: true
  });

  return Rol;
};

