# GUÍA DE MANTENIMIENTO: CONEXIONES A BASE DE DATOS

## Visión general del sistema

WebSAP utiliza múltiples mecanismos para conectarse a la base de datos MySQL:

1. **Sequelize ORM**: Para modelos, relaciones y consultas estructuradas
2. **Pool de MySQL**: Para consultas directas a la base de datos
3. **Conexiones directas**: Utilizadas en algunos scripts de mantenimiento

## Estructura de archivos clave

- **config/database.js**: Contiene la configuración de Sequelize
- **config/dbPool.js**: Configura el pool de conexiones de MySQL
- **models/index.js**: Punto central para importar modelos y obtener la instancia de Sequelize
- **utils/dbConnectionManager.js**: Herramienta para verificar y reparar conexiones

## Configuración de la base de datos

La configuración de la base de datos se obtiene del archivo `.env` en el directorio raíz:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=contraseña
DB_NAME=websap
DB_PORT=3306
```

## Diagnóstico de problemas

### Herramientas de diagnóstico

El sistema incluye scripts específicos para diagnosticar problemas de conexión:

- **scripts/database-repair-tool.js**: Herramienta integral para diagnóstico y reparación
- **scripts/simple-db-test.js**: Prueba simple de conexión directa
- **scripts/simple-models-test.js**: Prueba de carga de modelos
- **scripts/verify-all-connections.js**: Verificación completa de todas las conexiones

Para ejecutar cualquiera de estas herramientas:

```bash
node scripts/database-repair-tool.js
```

### Problemas comunes y soluciones

#### Error: "Too many connections"

Este error ocurre cuando se han agotado las conexiones disponibles en MySQL.

**Solución**:
1. Reiniciar el servicio MySQL:
   ```
   # En Windows
   net stop mysql
   net start mysql
   
   # En Linux
   sudo systemctl restart mysql
   ```
2. Verificar límites de conexiones en el archivo `config/dbPool.js`

#### Error: "ER_ACCESS_DENIED_ERROR"

Este error ocurre cuando las credenciales de acceso son incorrectas.

**Solución**:
1. Verificar credenciales en el archivo `.env`
2. Comprobar que el usuario tenga permisos suficientes en MySQL

#### Error: "Identifier 'DataTypes' has already been declared"

Este error ocurre si hay problemas con la importación de DataTypes en los modelos.

**Solución**:
1. Ejecutar el script de reparación:
   ```
   node scripts/fix-datatypes-issue.js
   ```

#### Error: "Table doesn't exist"

Este error ocurre cuando la estructura de la base de datos no está actualizada.

**Solución**:
1. Verificar estado de las migraciones
2. Ejecutar migraciones pendientes:
   ```
   npx sequelize-cli db:migrate
   ```

## Mantenimiento preventivo

Para mantener la conexión a la base de datos funcionando correctamente:

1. **Monitoreo regular**: Usar el endpoint `/api/system/status` para verificar el estado del sistema
2. **Mantenimiento programado**: Ejecutar `scripts/database-repair-tool.js` periódicamente
3. **Respaldos regulares**: Asegurar que los respaldos automáticos estén funcionando

## Referencias

- [Documentación de Sequelize](https://sequelize.org/docs/v6/)
- [Documentación de MySQL](https://dev.mysql.com/doc/)
- [Node MySQL2](https://github.com/sidorares/node-mysql2#readme)
