-- 030_caja_numeros.sql
-- Numeración física de cajas (1 y 2) para las sesiones de caja.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

-- ============================================
-- 1. Columna numero_caja en sesiones_caja
-- ============================================
SET @existe_numero := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sesiones_caja'
      AND COLUMN_NAME = 'numero_caja'
);
SET @sql := IF(
    @existe_numero = 0,
    'ALTER TABLE sesiones_caja ADD COLUMN numero_caja TINYINT UNSIGNED DEFAULT NULL AFTER estado',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Asignar número a las sesiones abiertas que no lo tengan
--    (la ferretería tiene 2 cajas físicas: 1 y 2)
-- ============================================
UPDATE sesiones_caja
SET numero_caja = 1
WHERE estado = 'abierta'
  AND numero_caja IS NULL
ORDER BY id ASC
LIMIT 1;

UPDATE sesiones_caja
SET numero_caja = 2
WHERE estado = 'abierta'
  AND numero_caja IS NULL
ORDER BY id ASC
LIMIT 1;

-- Reversos
-- ALTER TABLE sesiones_caja DROP COLUMN numero_caja;
