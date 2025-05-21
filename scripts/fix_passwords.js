// Script para verificar y corregir contraseñas en la base de datos
const { sequelize, Usuario } = require('../models');

async function main() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Obtener todos los usuarios
    const usuarios = await Usuario.findAll();
    
    console.log('=== USUARIOS EN LA BASE DE DATOS ===');
    console.log(`Total de usuarios: ${usuarios.length}`);
    
    // Mostrar información de contraseñas
    console.log('\n=== CONTRASEÑAS ACTUALES ===');
    usuarios.forEach(usuario => {
      console.log(`ID: ${usuario.id}, Email: ${usuario.email}, Contraseña: ${usuario.password}`);
    });
    
    // Preguntar si desea actualizar la contraseña de algún usuario
    const userEmail = process.argv[2];
    const newPassword = process.argv[3];
    
    if (userEmail && newPassword) {
      // Actualizar contraseña
      const usuario = await Usuario.findOne({ where: { email: userEmail } });
      
      if (usuario) {
        // Actualizar contraseña en texto plano
        usuario.password = newPassword;
        await usuario.save();
        
        console.log(`\n✅ Contraseña actualizada para ${userEmail}`);
        console.log(`Nueva contraseña: ${newPassword}`);
      } else {
        console.log(`\n❌ Usuario no encontrado: ${userEmail}`);
      }
    } else {
      console.log('\nPara actualizar una contraseña, ejecute:');
      console.log('node scripts/fix_passwords.js <email> <nueva_contraseña>');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('\nConexión a la base de datos cerrada.');
  }
}

main();
