require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');


/**
 * Script para inicializar la base de datos con datos iniciales
 */

// Función para generar hash de contraseña
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Sembrar usuarios iniciales
async function seedUsers() {
  try {
    console.log('Sembrando usuarios iniciales...');
    
    // Verificar si ya existen usuarios
    const userCount = await Usuario.count();
    if (userCount > 0) {
      console.log('Ya existen usuarios en la base de datos. Omitiendo...');
      return;
    }
    
    // Crear usuario administrador por defecto
    const hashedPassword = await hashPassword('admin123');
    
    await Usuario.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'Superadministrador',
      isActive: true
    });
    
    console.log('✅ Usuario administrador creado exitosamente');
  } catch (error) {
    console.error('Error al sembrar usuarios:', error);
    throw error;
  }
}

// Sembrar configuraciones del sistema
async function seedSystemConfigs() {
  try {
    console.log('Sembrando configuraciones del sistema...');
    
    // Verificar si ya existen configuraciones
    const configCount = await db.SystemConfig.count();
    if (configCount > 0) {
      console.log('Ya existen configuraciones en la base de datos. Omitiendo...');
      return;
    }
    
    // Configuraciones del sistema
    const configurations = [
      {
        key: 'system_name',
        value: 'WebSAP',
        description: 'Nombre del sistema',
        isSystem: true
      },
      {
        key: 'system_version',
        value: '1.0.0',
        description: 'Versión del sistema',
        isSystem: true
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Indica si el sistema está en modo mantenimiento',
        isSystem: true
      },
      {
        key: 'support_email',
        value: 'soporte@websap.com',
        description: 'Email de soporte',
        isSystem: false
      }
    ];
    
    await db.SystemConfig.bulkCreate(configurations);
    
    console.log('✅ Configuraciones del sistema creadas exitosamente');
  } catch (error) {
    console.error('Error al sembrar configuraciones del sistema:', error);
    throw error;
  }
}

// Función principal para sembrar datos
async function seedAll() {
  try {
    console.log('🌱 Iniciando proceso de siembra de datos...');
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    
    // 1. Crear roles básicos del sistema
    const roles = [
      { nombre: 'Superadministrador' },
      { nombre: 'Administrador' },
      { nombre: 'Empleado' }
    ];

    for (const rolData of roles) {
      const [rol, created] = await Rol.findOrCreate({
        where: { nombre: rolData.nombre },
        defaults: rolData
      });
      
      if (created) {
        console.log(`Rol creado: ${rol.nombre}`);
      } else {
        console.log(`Rol existente: ${rol.nombre}`);
      }
    }

    // 2. Crear usuario superadministrador por defecto
    const superadminData = {
      nombre: 'Superadministrador',
      email: 'admin@websap.com',
      password_hash: await bcrypt.hash('Admin123!', 10),
      telefono: '3001234567',
      estado: 'activo'
    };

    const [superadmin, created] = await Usuario.findOrCreate({
      where: { email: superadminData.email },
      defaults: superadminData
    });

    if (created) {
      console.log(`Usuario superadmin creado: ${superadmin.email}`);
    } else {
      console.log(`Usuario superadmin existente: ${superadmin.email}`);
      // Actualizar password por si cambió
      superadmin.password_hash = superadminData.password_hash;
      await superadmin.save();
      console.log(`Password de superadmin actualizada`);
    }

    // 3. Asignar rol de superadministrador
    const rolSuperAdmin = await Rol.findOne({
      where: { nombre: 'Superadministrador' }
    });

    if (rolSuperAdmin) {
      await superadmin.addRol(rolSuperAdmin);
      console.log(`Rol de Superadministrador asignado a ${superadmin.email}`);
    }

    // Sembrar datos en orden
    await seedUsers();
    await seedSystemConfigs();
    
    console.log('✅ Datos sembrados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el proceso de siembra:', error);
    process.exit(1);
  }
}

// Si se ejecuta directamente este script
if (require.main === module) {
  seedAll();
}

// Exportar para uso en otros scripts
module.exports = {
  seedUsers,
  seedSystemConfigs,
  seedAll
};
