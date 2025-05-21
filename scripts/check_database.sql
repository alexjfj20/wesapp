-- Script para verificar y corregir la estructura de la base de datos de WebSAP
-- Este script ayuda a diagnosticar problemas con la autenticación de usuarios

-- Mostrar usuarios existentes (sin contraseñas)
SELECT id, nombre, email, activo, created_at, updated_at 
FROM usuarios;

-- Mostrar roles de usuarios
SELECT ur.usuario_id, u.email, ur.rol
FROM usuario_roles ur
JOIN usuarios u ON ur.usuario_id = u.id
ORDER BY ur.usuario_id;

-- Verificar si hay usuarios sin roles
SELECT u.id, u.email 
FROM usuarios u
LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
WHERE ur.id IS NULL;

-- Verificar estructura de la tabla usuarios
DESCRIBE usuarios;

-- Verificar estructura de la tabla usuario_roles
DESCRIBE usuario_roles;

-- Verificar índices en la tabla usuarios
SHOW INDEX FROM usuarios;

-- Verificar índices en la tabla usuario_roles
SHOW INDEX FROM usuario_roles;
