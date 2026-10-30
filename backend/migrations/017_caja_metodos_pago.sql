-- 017_caja_metodos_pago.sql
-- Agrega el resumen de ventas por método de pago a las sesiones de caja.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

SET @existe_tarjeta := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sesiones_caja'
      AND COLUMN_NAME = 'ventas_tarjeta'
);
SET @sql := IF(
    @existe_tarjeta = 0,
    'ALTER TABLE sesiones_caja ADD COLUMN ventas_tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER ventas_efectivo',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe_transferencia := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sesiones_caja'
      AND COLUMN_NAME = 'ventas_transferencia'
);
SET @sql := IF(
    @existe_transferencia = 0,
    'ALTER TABLE sesiones_caja ADD COLUMN ventas_transferencia DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER ventas_tarjeta',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Reversos:
-- ALTER TABLE sesiones_caja DROP COLUMN ventas_transferencia, DROP COLUMN ventas_tarjeta;
