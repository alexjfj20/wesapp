require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  // Get DB credentials from environment
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'websap';
  const dbPort = process.env.DB_PORT || 3306;
  
  console.log('Database connection parameters:');
  console.log(`- Host: ${dbHost}`);
  console.log(`- User: ${dbUser}`);
  console.log(`- Database: ${dbName}`);
  console.log(`- Port: ${dbPort}`);
  
  try {
    console.log('\nTesting direct MySQL connection...');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort
    });
    
    console.log('Connection established successfully!');
    
    // Check if database exists
    const [result] = await connection.query('SELECT 1+1 as sum');
    console.log('Test query result:', result[0].sum);
    
    await connection.end();
    console.log('Connection closed successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed!', error.message);
    console.error(error);
    return false;
  }
}

testConnection()
  .then(success => {
    console.log(`\nTest result: ${success ? 'SUCCESS' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  });
