/**
 * Script para inicializar la base de datos con datos iniciales
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../models');

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
    const userCount = await db.User.count();
    if (userCount > 0) {
      console.log('Ya existen usuarios en la base de datos. Omitiendo...');
      return;
    }
    
    // Crear usuario administrador por defecto
    const hashedPassword = await hashPassword('admin123');
    
    await db.User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
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
    await db.sequelize.sync({ alter: true });
    
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