-- Migración manual para implementar múltiples restaurantes
-- Este script debe ejecutarse directamente en MySQL para evitar el error "Too many keys"

-- Paso 1: Crear tabla de restaurantes si no existe
CREATE TABLE IF NOT EXISTS restaurantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  direccion VARCHAR(255),
  telefono VARCHAR(50),
  descripcion TEXT,
  logo VARCHAR(255),
  enlace_compartido VARCHAR(100) UNIQUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Paso 2: Añadir columna restaurante_id a la tabla platos si no existe
SET @platos_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'platos' 
  AND COLUMN_NAME = 'restaurante_id'
);

SET @platos_sql = IF(@platos_check = 0, 
  'ALTER TABLE platos ADD COLUMN restaurante_id INT NULL', 
  'SELECT "La columna restaurante_id ya existe en la tabla platos" AS mensaje'
);

PREPARE platos_stmt FROM @platos_sql;
EXECUTE platos_stmt;
DEALLOCATE PREPARE platos_stmt;

-- Paso 3: Añadir columna restaurante_id a la tabla usuarios si no existe
SET @usuarios_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME = 'restaurante_id'
);

SET @usuarios_sql = IF(@usuarios_check = 0, 
  'ALTER TABLE usuarios ADD COLUMN restaurante_id INT NULL', 
  'SELECT "La columna restaurante_id ya existe en la tabla usuarios" AS mensaje'
);

PREPARE usuarios_stmt FROM @usuarios_sql;
EXECUTE usuarios_stmt;
DEALLOCATE PREPARE usuarios_stmt;

-- Paso 4: Añadir columna restaurante_id a la tabla reservas si no existe
SET @reservas_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'reservas' 
  AND COLUMN_NAME = 'restaurante_id'
);

SET @reservas_sql = IF(@reservas_check = 0, 
  'ALTER TABLE reservas ADD COLUMN restaurante_id INT NULL', 
  'SELECT "La columna restaurante_id ya existe en la tabla reservas" AS mensaje'
);

PREPARE reservas_stmt FROM @reservas_sql;
EXECUTE reservas_stmt;
DEALLOCATE PREPARE reservas_stmt;

-- Paso 5: Crear un restaurante por defecto para cada administrador si no tiene uno
INSERT INTO restaurantes (nombre, descripcion, created_by, enlace_compartido)
SELECT 
  CONCAT('Restaurante de ', u.nombre),
  CONCAT('Restaurante gestionado por ', u.email),
  u.id,
  CONCAT('r_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 8))
FROM usuarios u
LEFT JOIN restaurantes r ON r.created_by = u.id
WHERE (u.roles LIKE '%Administrador%' OR u.roles LIKE '%Superadministrador%')
AND r.id IS NULL;

-- Paso 6: Asignar restaurantes a los administradores
UPDATE usuarios u
JOIN restaurantes r ON r.created_by = u.id
SET u.restaurante_id = r.id
WHERE u.restaurante_id IS NULL
AND (u.roles LIKE '%Administrador%' OR u.roles LIKE '%Superadministrador%');

-- Paso 7: Asignar restaurantes a los usuarios creados por administradores
UPDATE usuarios u
JOIN usuarios admin ON u.created_by = admin.id
SET u.restaurante_id = admin.restaurante_id
WHERE u.restaurante_id IS NULL
AND admin.restaurante_id IS NOT NULL;

-- Paso 8: Asignar restaurantes a los platos
UPDATE platos p
JOIN usuarios u ON p.created_by = u.id
SET p.restaurante_id = u.restaurante_id
WHERE p.restaurante_id IS NULL
AND u.restaurante_id IS NOT NULL;

-- Paso 9: Asignar restaurantes a las reservas
UPDATE reservas r
JOIN usuarios u ON r.created_by = u.id
SET r.restaurante_id = u.restaurante_id
WHERE r.restaurante_id IS NULL
AND u.restaurante_id IS NOT NULL;
