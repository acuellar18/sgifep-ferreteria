-- 003_superadmin.sql
-- Módulo de Usuarios v2 (arquitectura MVC + JWT): agrega la columna superadmin a
-- `roles` para indicar acceso total del rol. Compatible con el esquema anterior
-- (acceso_total) y con la tabla usuario_roles.
--
-- Idempotente: si la columna ya existe (por ejemplo, la creó `seed.js`), no se
-- vuelve a crear. Se puede ejecutar más de una vez sin errores (npm run migrate).

SET @existe_superadmin := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'roles'
      AND COLUMN_NAME = 'superadmin'
);

SET @sql := IF(
    @existe_superadmin = 0,
    'ALTER TABLE roles ADD COLUMN superadmin TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Indica si el rol permite acceso total (superadmin)''',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Sincroniza con el valor histórico de acceso_total (permite ejecutar varias veces).
UPDATE roles SET superadmin = acceso_total WHERE superadmin <> acceso_total;