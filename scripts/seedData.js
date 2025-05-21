const bcrypt = require('bcrypt');
const { models } = require('../models');

async function seedData() {
  try {
    // Crear roles iniciales
    const roles = await models.Rol.bulkCreate([
      { nombre: 'Superadministrador', descripcion: 'Acceso completo al sistema' },
      { nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
      { nombre: 'Empleado', descripcion: 'Acceso básico al sistema' }
    ], { ignoreDuplicates: true });
    
    console.log('Roles creados:', roles.map(r => r.nombre));
    
    // Crear usuario superadmin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('SuperAdmin2023', salt);
    
    const superadmin = await models.Usuario.findOrCreate({
      where: { email: 'superadmin@gmail.com' },
      defaults: {
        username: 'superadmin',
        password: hashedPassword,
        nombre: 'Super Administrador'
      }
    });
    
    console.log('Usuario superadmin creado:', superadmin[0].email);
    
    // Asignar rol de superadministrador
    const superadminRole = await models.Rol.findOne({ 
      where: { nombre: 'Superadministrador' } 
    });
    
    if (superadminRole) {
      await superadmin[0].addRol(superadminRole);
      console.log('Rol Superadministrador asignado a', superadmin[0].email);
    }
    
    console.log('Datos iniciales insertados correctamente');
  } catch (error) {
    console.error('Error al insertar datos iniciales:', error);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedData; 