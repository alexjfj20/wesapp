/**
 * Script para probar los endpoints REST y detectar problemas específicos
 * como errores 405 Method Not Allowed
 * 
 * Ejecutar: node scripts/test-endpoints.js
 */
require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuración del servidor para las pruebas
const SERVER_HOST = process.env.TEST_HOST || 'localhost';
const SERVER_PORT = process.env.PORT || 3000;
const BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Endpoints a probar
const ENDPOINTS = [
  { path: '/api/ping', method: 'GET' },
  { path: '/api/health-check', method: 'GET' },
  { path: '/api/admin/users', method: 'GET' },
  { path: '/api/admin/users', method: 'POST', body: { nombre: 'Test', email: 'test@example.com', password: 'TestPassword123' } },
  { path: '/api/admin/roles', method: 'GET' },
  { path: '/api/users', method: 'GET' },
  { path: '/api/auth/login', method: 'POST', body: { email: 'admin@example.com', password: 'admin' } }
];

/**
 * Prueba un endpoint y devuelve el resultado
 * @param {Object} endpointInfo Información del endpoint a probar
 */
async function testEndpoint(endpointInfo) {
  const { path, method, body } = endpointInfo;
  const url = `${BASE_URL}${path}`;
  
  console.log(`${colors.blue}Probando ${method} ${path}${colors.reset}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Agregar cuerpo si es necesario
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    // Obtener cuerpo de la respuesta
    let responseBody = null;
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch (e) {
      responseBody = null;
    }
    
    // Analizar la respuesta
    const statusInfo = getStatusInfo(response.status);
    
    // Determinar color según el resultado
    const statusColor = response.ok ? colors.green : colors.red;
    console.log(`${statusColor}${response.status} ${response.statusText}${colors.reset}`);
    
    const result = {
      path,
      method,
      status: response.status,
      statusText: response.statusText,
      contentType,
      response: responseBody,
      success: response.ok,
      info: statusInfo
    };
    
    // Mostrar más detalles para ciertos códigos
    if (response.status === 405) {
      console.log(`${colors.yellow}⚠️ ERROR 405: Método ${method} no permitido en ${path}${colors.reset}`);
      console.log(`${colors.yellow}Este es uno de los problemas que estamos resolviendo${colors.reset}`);
      
      // Sugerir diagnóstico adicional
      if (path.includes('/admin/')) {
        console.log(`${colors.yellow}Compruebe que el archivo routes/adminRoutes.js maneje el método ${method}${colors.reset}`);
        console.log(`${colors.yellow}Compruebe que la ruta esté correctamente registrada en app.js${colors.reset}`);
      }
    }
    
    return result;
  } catch (error) {
    console.log(`${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
    
    // Si es error de conexión, dar recomendaciones
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      console.log(`${colors.yellow}⚠️ No se pudo conectar al servidor. Verifique:${colors.reset}`);
      console.log(`${colors.yellow}- ¿El servidor está en ejecución en ${SERVER_HOST}:${SERVER_PORT}?${colors.reset}`);
      console.log(`${colors.yellow}- ¿El puerto ${SERVER_PORT} está correcto?${colors.reset}`);
    }
    
    return {
      path,
      method,
      error: error.message,
      success: false
    };
  }
}

/**
 * Obtiene información de diagnóstico según el código de estado HTTP
 */
function getStatusInfo(statusCode) {
  switch (statusCode) {
    case 200:
      return { level: 'success', message: 'OK - La petición fue exitosa' };
    case 201:
      return { level: 'success', message: 'Created - Recurso creado exitosamente' };
    case 204:
      return { level: 'success', message: 'No Content - La petición fue exitosa pero no hay contenido para devolver' };
    case 400:
      return { level: 'error', message: 'Bad Request - La petición tiene sintaxis incorrecta o no puede ser procesada' };
    case 401:
      return { level: 'error', message: 'Unauthorized - Autenticación requerida' };
    case 403:
      return { level: 'error', message: 'Forbidden - No tiene permisos para acceder' };
    case 404:
      return { level: 'error', message: 'Not Found - Recurso no encontrado' };
    case 405:
      return { level: 'error', message: 'Method Not Allowed - El método HTTP no está permitido para este recurso' };
    case 500:
      return { level: 'error', message: 'Internal Server Error - Error interno del servidor' };
    default:
      if (statusCode >= 200 && statusCode < 300) {
        return { level: 'success', message: 'Petición exitosa' };
      } else if (statusCode >= 400 && statusCode < 500) {
        return { level: 'error', message: 'Error en la petición' };
      } else if (statusCode >= 500) {
        return { level: 'error', message: 'Error en el servidor' };
      } else {
        return { level: 'info', message: 'Código de estado desconocido' };
      }
  }
}

/**
 * Guarda los resultados de las pruebas en un archivo JSON
 */
function saveResults(results) {
  try {
    const date = new Date().toISOString().replace(/:/g, '-');
    const resultsPath = path.join(__dirname, `../logs/endpoint-tests-${date}.json`);
    
    // Crear directorio de logs si no existe
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Guardar resultados
    fs.writeFileSync(
      resultsPath, 
      JSON.stringify({
        timestamp: new Date().toISOString(),
        server: `${SERVER_HOST}:${SERVER_PORT}`,
        results
      }, null, 2)
    );
    
    console.log(`${colors.green}✅ Resultados guardados en: ${resultsPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al guardar resultados: ${error.message}${colors.reset}`);
  }
}

/**
 * Muestra un resumen de los resultados
 */
function showSummary(results) {
  let successful = 0;
  let failed = 0;
  let method405 = 0;
  
  results.forEach(result => {
    if (result.success) {
      successful++;
    } else {
      failed++;
      if (result.status === 405) {
        method405++;
      }
    }
  });
  
  console.log('\n');
  console.log(`${colors.cyan}=== RESUMEN DE PRUEBAS ===${colors.reset}`);
  console.log(`${colors.cyan}Total de endpoints probados: ${results.length}${colors.reset}`);
  console.log(`${colors.green}✅ Pruebas exitosas: ${successful}${colors.reset}`);
  console.log(`${colors.red}❌ Pruebas fallidas: ${failed}${colors.reset}`);
  
  if (method405 > 0) {
    console.log(`${colors.yellow}⚠️ Errores 405 (Method Not Allowed): ${method405}${colors.reset}`);
    console.log(`${colors.yellow}↳ Este error ocurre cuando un método HTTP no está implementado o permitido para una ruta${colors.reset}`);
    
    // Mostrar los endpoints con error 405
    console.log(`${colors.yellow}Endpoints con error 405:${colors.reset}`);
    results.forEach(result => {
      if (result.status === 405) {
        console.log(`${colors.yellow}↳ ${result.method} ${result.path}${colors.reset}`);
      }
    });
    
    console.log('\n');
    console.log(`${colors.cyan}=== RECOMENDACIONES PARA ERRORES 405 ===${colors.reset}`);
    console.log(`${colors.cyan}1. Verificar que todos los métodos necesarios estén implementados en los controladores${colors.reset}`);
    console.log(`${colors.cyan}2. Verificar que las rutas estén correctamente configuradas en app.js${colors.reset}`);
    console.log(`${colors.cyan}3. Para rutas /admin/*, verificar adminRoutes.js${colors.reset}`);
    console.log(`${colors.cyan}4. Para rutas /users, verificar userRoutes.js${colors.reset}`);
    console.log(`${colors.cyan}5. Comprobar que los middlewares no bloqueen métodos específicos${colors.reset}`);
  }
}

/**
 * Función principal para probar todos los endpoints
 */
async function runEndpointTests() {
  console.log(`${colors.cyan}=== PRUEBA DE ENDPOINTS API ===${colors.reset}`);
  console.log(`${colors.cyan}Servidor: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.cyan}Fecha: ${new Date().toISOString()}${colors.reset}`);
  console.log('\n');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log('\n');
  }
  
  showSummary(results);
  saveResults(results);
}

// Ejecutar las pruebas
runEndpointTests().catch(error => {
  console.error(`${colors.red}❌ Error general: ${error.message}${colors.reset}`);
});
