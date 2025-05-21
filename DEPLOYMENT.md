# Guía de Implementación de WebSAP en VPS

Esta guía detalla los pasos para implementar WebSAP en un servidor VPS con HTTPS y configuración de CORS.

## Requisitos Previos

- VPS con sistema operativo Ubuntu/Debian (recomendado)
- Dominio configurado para apuntar a la IP del VPS (93.127.129.74)
- Puertos 80 y 443 accesibles para HTTPS
- Acceso SSH al servidor

## Pasos de Implementación

### 1. Preparar el Código para Producción

1. **Frontend (Vue.js):**
   ```bash
   cd /ruta/al/frontend
   npm install
   npm run build  # Crea archivos estáticos en la carpeta dist/
   ```

2. **Backend (Express):**
   ```bash
   cd /ruta/al/backend
   npm install --production
   ```

### 2. Copiar Archivos al Servidor

1. **Usando SCP o SFTP:**
   ```bash
   # Copiar backend
   scp -r ./backend user@93.127.129.74:/var/www/websap/
   
   # Copiar frontend compilado (archivos dist)
   scp -r ./frontend/dist/* user@93.127.129.74:/var/www/websap/dist/
   
   # Copiar archivos de configuración
   scp ./deploy.sh ./backend/.env.production user@93.127.129.74:/var/www/websap/
   ```

### 3. Configurar y Ejecutar en el VPS

1. **Conectar al servidor:**
   ```bash
   ssh user@93.127.129.74
   ```

2. **Ejecutar el script de despliegue:**
   ```bash
   cd /var/www/websap
   cp .env.production backend/.env  # Usar la configuración de producción
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

3. **Verificar implementación:**
   ```bash
   # Revisar el estado de los servicios
   sudo systemctl status caddy
   sudo systemctl status websap-backend
   
   # Ver logs en tiempo real
   sudo journalctl -u caddy -f
   sudo journalctl -u websap-backend -f
   ```

### 4. Verificación Final

1. Visitar `https://websap.site` en un navegador
2. Verificar que la API funciona correctamente
3. Probar las funcionalidades críticas

### 5. Resolución de Problemas

- **Error CORS:** Verificar la configuración en `/var/www/websap/backend/config/cors-config.js`
- **Error HTTPS:** Verificar los logs de Caddy con `sudo journalctl -u caddy -f`
- **API no responde:** Verificar los logs del backend con `sudo journalctl -u websap-backend -f`
- **Puerto ocupado:** Usar `sudo lsof -i :3000` para verificar qué proceso usa el puerto

### 6. Mantenimiento

- **Actualizar la aplicación:**
  ```bash
  # Detener servicios
  sudo systemctl stop websap-backend
  
  # Copiar nuevos archivos
  # (usar los comandos SCP o SFTP mencionados anteriormente)
  
  # Reiniciar servicios
  sudo systemctl start websap-backend
  ```

- **Backup de la base de datos (MySQL):**
  ```bash
  mysqldump -u websap_user -p websap > websap_backup_$(date +%Y%m%d).sql
  ```

## Seguridad Adicional

- **Firewall:** Configurar UFW para permitir solo los puertos necesarios
  ```bash
  sudo ufw allow 22
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw enable
  ```

- **Fail2Ban:** Instalar para proteger contra intentos de acceso SSH
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

- **Actualización Automática:** Configurar actualizaciones automáticas de seguridad
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure unattended-upgrades
  ```

## Referencia Rápida

- **IP del servidor:** 93.127.129.74
- **Dominio:** websap.site
- **Puerto API:** 3000 (interno), accesible vía https://websap.site/api
- **Ubicación de archivos frontend:** /var/www/websap/dist
- **Ubicación de archivos backend:** /var/www/websap/backend
- **Configuración Caddy:** /etc/caddy/Caddyfile
- **Logs de Caddy:** /var/log/caddy/websap.log
- **Servicio systemd backend:** websap-backend.service
