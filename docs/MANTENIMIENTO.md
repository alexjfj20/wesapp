# WebSAP - Manual de Mantenimiento y Corrección de Errores

Este documento proporciona instrucciones detalladas para el mantenimiento del sistema WebSAP y la corrección de errores comunes.

## Índice

1. [Problemas Comunes](#problemas-comunes)
2. [Scripts de Diagnóstico](#scripts-de-diagnóstico)
3. [Corrección de Errores](#corrección-de-errores)
4. [Mantenimiento Preventivo](#mantenimiento-preventivo)
5. [Contacto y Soporte](#contacto-y-soporte)

## Problemas Comunes

### 1. Error 405 Method Not Allowed

Este error ocurre cuando se intenta hacer una petición HTTP con un método no permitido para esa ruta.

**Síntomas:**
- Recibir un error 405 al intentar crear, actualizar o eliminar recursos.
- La interfaz muestra mensajes de error al guardar cambios.

**Solución:**
1. Verificar que el método esté implementado en el controlador correspondiente.
2. Revisar que la ruta esté correctamente registrada en `app.js` o `server.js`.
3. Comprobar que no haya middleware bloqueando el método.

Para diagnosticar:
```powershell
cd c:\wesapp\backend
node scripts\test-endpoints.js
```

### 2. HTML en lugar de JSON

Este error ocurre cuando el servidor devuelve HTML (generalmente una página de error) en lugar de JSON.

**Síntomas:**
- La aplicación muestra errores de parseo de JSON.
- Al inspeccionar la respuesta se ve HTML en lugar de JSON.

**Solución:**
El servicio `apiService.js` ha sido mejorado para manejar este caso automáticamente y extraer información útil del HTML.

### 3. Problemas de Conexión a la Base de Datos

**Síntomas:**
- Errores al cargar datos o guardar cambios.
- Mensajes de error sobre conexión rechazada o timeout.

**Solución:**
1. Verificar que el servidor MySQL esté en ejecución.
2. Comprobar las credenciales en el archivo `.env`.
3. Ejecutar el script de diagnóstico de base de datos:

```powershell
cd c:\wesapp\backend
node scripts\test-database-connection.js
```

### 4. Problemas de Sincronización

**Síntomas:**
- Los datos no se sincronizan entre el frontend y el backend.
- Errores relacionados con la sincronización de datos.

**Solución:**
1. Verificar la configuración de sincronización en el archivo `.env`.
2. Ejecutar el script de corrección de sincronización:

```powershell
cd c:\wesapp\backend
node scripts\fix-sync-config.js
```

## Scripts de Diagnóstico

El sistema incluye varios scripts de diagnóstico para ayudar a identificar y corregir problemas:

### Diagnóstico General
```powershell
node scripts\run-diagnostics.js
```
Este script ejecuta un diagnóstico completo del sistema y proporciona recomendaciones para solucionar problemas detectados.

### Prueba de Conexión a la Base de Datos
```powershell
node scripts\test-database-connection.js
```
Este script realiza pruebas específicas de conexión a la base de datos y ofrece diagnóstico detallado.

### Prueba de Endpoints
```powershell
node scripts\test-endpoints.js
```
Este script prueba los endpoints críticos de la API y detecta problemas como errores 405.

### Corrección de Configuración de Sincronización
```powershell
node scripts\fix-sync-config.js
```
Este script verifica y corrige la configuración de sincronización.

## Corrección de Errores

### Normalización de Rutas API

El servicio `apiService.js` incluye una función `normalizeEndpoint()` que corrige automáticamente problemas comunes en las rutas:

- Detecta y corrige duplicación de prefijos `/api/`
- Redirige automáticamente `/users` a `/admin/users` y `/roles` a `/admin/roles`
- Formatea correctamente las URLs para evitar dobles barras
- Proporciona advertencias en la consola para ayudar a diagnosticar problemas

### Manejo de Errores

Las funciones `get`, `post`, `put` y `delete` en `apiService.js` han sido mejoradas para:

- Proporcionar respuestas consistentes siempre en formato JSON
- Manejar casos de respuestas HTML en lugar de JSON
- Registrar información detallada en la consola para diagnóstico
- Prevenir errores no capturados

### Conexiones a la Base de Datos

El utilidad `dbConnectionManager.js` proporciona funciones para:

- Verificar el estado de las conexiones a la base de datos
- Intentar reparar conexiones perdidas
- Diagnosticar problemas de conexión

## Mantenimiento Preventivo

Para evitar problemas en el futuro, se recomienda:

1. **Verificación Regular:**
   ```powershell
   node scripts\run-diagnostics.js
   ```

2. **Copia de Seguridad de la Base de Datos:**
   ```powershell
   # Agregar instrucciones específicas según la configuración
   ```

3. **Verificación de Logs:**
   Revisar periódicamente los archivos de log en `c:\wesapp\backend\logs\` para detectar errores recurrentes.

4. **Actualización de Dependencias:**
   Periodicamente revisar y actualizar las dependencias para evitar vulnerabilidades de seguridad.

## Contacto y Soporte

Para soporte adicional, contacte a:
- Equipo de Desarrollo: desarrollo@ejemplo.com
- Administración de Sistemas: sistemas@ejemplo.com

---

Documentación creada el 16 de mayo de 2025. Última actualización: 16/05/2025.
