-- 031_pos_pago_credito.sql
-- Permitir ventas a crédito en POS: extiende el ENUM metodo_pago
-- de ventas y cobros con el valor 'credito'.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

-- ============================================
-- 1. ventas.metodo_pago
-- ============================================
SET @ventas_enum := (
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ventas'
      AND COLUMN_NAME = 'metodo_pago'
);
SET @sql := IF(
    @ventas_enum NOT LIKE '%''credito''%',
    "ALTER TABLE ventas MODIFY COLUMN metodo_pago ENUM('efectivo','tarjeta','transferencia','credito') NOT NULL",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. cobros.metodo_pago
-- ============================================
SET @cobros_enum := (
    SELECT COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cobros'
      AND COLUMN_NAME = 'metodo_pago'
);
SET @sql := IF(
    @cobros_enum NOT LIKE '%''credito''%',
    "ALTER TABLE cobros MODIFY COLUMN metodo_pago ENUM('efectivo','tarjeta','transferencia','credito') NOT NULL",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Reversos
-- ALTER TABLE ventas MODIFY COLUMN metodo_pago ENUM('efectivo','tarjeta','transferencia') NOT NULL;
-- ALTER TABLE cobros MODIFY COLUMN metodo_pago ENUM('efectivo','tarjeta','transferencia') NOT NULL;
