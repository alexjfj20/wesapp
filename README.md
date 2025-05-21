# WebSAP - Sistema de Administración de Restaurantes

## Descripción
WebSAP es un sistema completo para la administración de restaurantes, que incluye gestión de menús, pedidos, mesas, inventario y más.

## Estructura del proyecto
```
wesapp/
├── backend/              # API y lógica del servidor
├── frontend/             # Interfaz de usuario (Vue.js)
├── package.json          # Configuración npm del proyecto
```

## Cómo empezar

### Requisitos previos
- Node.js (v14.x o superior)
- npm (v6.x o superior)
- MySQL (opcional, también funciona con SQLite)

### Instalación y ejecución en desarrollo

1. Clonar el repositorio
```bash
git clone https://github.com/alexjfj20/wesapp.git
cd wesapp
```

2. Instalar dependencias del backend
```bash
cd backend
npm install
```

3. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

4. Configurar variables de entorno
```bash
cp .env.example .env
# Editar el archivo .env con tus configuraciones
```

5. Iniciar en modo desarrollo
```bash
# En la raíz del proyecto
node start-dev.js
```

## Despliegue en producción

Para desplegar la aplicación en producción, consulta el archivo [DEPLOYMENT.md](./DEPLOYMENT.md) que contiene instrucciones detalladas.

### Notas importantes sobre la base de datos

Si estás desplegando a un entorno de producción, asegúrate de revisar la documentación sobre la corrección del error "Too many keys" en [DATABASE-TOO-MANY-KEYS-FIX.md](./backend/docs/DATABASE-TOO-MANY-KEYS-FIX.md).

**Importante:** La sincronización automática de la base de datos está desactivada en producción para evitar problemas de rendimiento y errores. Utiliza los scripts de migración en su lugar.

## Características principales

- **Gestión de menús**: Crea y administra diferentes menús y platos
- **Gestión de pedidos**: Seguimiento de pedidos en tiempo real
- **Administración de mesas**: Estado de mesas, reservaciones
- **Inventario**: Control de inventario de ingredientes
- **Informes**: Generación de informes de ventas y operaciones
- **Seguridad**: Sistema de usuarios y roles
- **Backup y sincronización**: Respaldo y sincronización automática de datos
- **Modo offline**: Funcionalidad IndexedDB para trabajar sin conexión
- **Compatible con diferentes bases de datos**: Funciona con MySQL y SQLite

## Tecnologías

### Backend
- Node.js con Express
- Sequelize ORM (compatible con MySQL y SQLite)
- JSON Web Token (JWT) para autenticación
- Socket.IO para comunicación en tiempo real

### Frontend
- Vue.js 3
- Vuex para gestión de estado
- Vue Router
- Axios para peticiones HTTP
- Tailwind CSS para estilos

## Contribuir al proyecto

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Actualización y mantenimiento

Para actualizar o mantener este repositorio:

```bash
git add .
git commit -m "Update con nuevas características y correcciones"
git push -u origin main
```

### Solución de problemas comunes

#### Error de conexión a la base de datos

Si encuentras errores relacionados con "Too many keys" o problemas de conexión a la base de datos:

1. Verifica la configuración en el archivo `.env`
2. Asegúrate de que la base de datos existe y es accesible
3. Consulta la documentación en `backend/docs/DATABASE-TOO-MANY-KEYS-FIX.md`

#### Error "API: No accesible"

Si el panel de administración muestra que la API no es accesible:

1. Verifica que el servidor backend esté corriendo
2. Comprueba que los puertos configurados sean correctos y estén libres
3. Revisa los logs en `logs/error.log` para más detalles

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Alex Fernández - [@alexjfj20](https://github.com/alexjfj20)

Enlace del proyecto: [https://github.com/alexjfj20/wesapp](https://github.com/alexjfj20/wesapp)
