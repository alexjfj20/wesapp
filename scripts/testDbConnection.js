const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Función para probar conexión directa con mysql2
async function testMySQLConnection() {
  console.log('🔍 Probando conexión directa a MySQL...');
  
  // Imprimir información de depuración (sin mostrar contraseñas)
  console.log('⚙️ Configuración de conexión:');
  console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`- Database: ${process.env.DB_NAME || 'websap_db'}`);
  console.log(`- Usuario: ${process.env.DB_USER || 'root'}`);
  console.log(`- Puerto: ${process.env.DB_PORT || 3306}`);
  console.log(`- Contraseña configurada: ${process.env.DB_PASS ? 'Sí' : 'No'}`);
  
  // Probar primero sin contraseña
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'websap_db',
      port: process.env.DB_PORT || 3306
      // Sin contraseña
    });
    
    console.log('✅ Conexión exitosa a MySQL SIN contraseña');
    
    // Verificar si la base de datos existe
    const [rows] = await conn.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME || 'websap_db']);
    
    if (rows.length === 0) {
      console.log(`⚠️ La base de datos '${process.env.DB_NAME || 'websap_db'}' no existe.`);
      console.log('Creando base de datos...');
      await conn.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'websap_db'} 
                         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Base de datos creada exitosamente');
    } else {
      console.log(`✅ La base de datos '${process.env.DB_NAME || 'websap_db'}' existe.`);
    }
    
    await conn.end();
    return true;
  } catch (error) {
    console.log('❌ Error conectando sin contraseña:', error.message);
    
    // Probar con contraseña si está configurada
    if (process.env.DB_PASS) {
      try {
        const conn = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASS,
          database: process.env.DB_NAME || 'websap_db',
          port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Conexión exitosa a MySQL CON contraseña');
        
        // Verificar si la base de datos existe
        const [rows] = await conn.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME || 'websap_db']);
        
        if (rows.length === 0) {
          console.log(`⚠️ La base de datos '${process.env.DB_NAME || 'websap_db'}' no existe.`);
          console.log('Creando base de datos...');
          await conn.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'websap_db'} 
                           CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
          console.log('✅ Base de datos creada exitosamente');
        } else {
          console.log(`✅ La base de datos '${process.env.DB_NAME || 'websap_db'}' existe.`);
        }
        
        await conn.end();
        return true;
      } catch (pwdError) {
        console.error('❌ Error conectando con contraseña:', pwdError.message);
      }
    }
    
    console.error('❌ No se pudo establecer conexión con MySQL.');
    console.log(`
INSTRUCCIONES PARA SOLUCIONAR PROBLEMAS DE CONEXIÓN:
1. Verifique que MySQL está en ejecución.
2. Verifique que las credenciales en el archivo .env son correctas.
3. Acceda a MySQL y ejecute este comando para verificar los usuarios y hosts permitidos:
   SELECT user, host FROM mysql.user;
4. Si usa root sin contraseña, asegúrese de no tener DB_PASS en su archivo .env.
5. Si necesita restablecer la contraseña de root, puede seguir esta guía:
   https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html
`);
    return false;
  }
}

// Ejecutar la prueba
testMySQLConnection().then(success => {
  if (success) {
    console.log('✅ La conexión a MySQL se realizó correctamente.');
  } else {
    console.error('❌ No se pudo conectar a MySQL.');
  }
});
