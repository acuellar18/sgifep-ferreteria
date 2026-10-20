-- Reverso de 009_inventario_esquema.sql
-- ADVERTENCIA: elimina columnas y datos de imágenes, saldo_resultante y motivo.
-- Convierte los orígenes nuevos a 'ajuste_manual' antes de restaurar el ENUM.

DELIMITER $$

DROP TRIGGER IF EXISTS trg_movimientos_before_insert$$
DROP TRIGGER IF EXISTS trg_movimientos_after_insert$$

DELIMITER ;

UPDATE movimientos_inventario
SET origen = 'ajuste_manual'
WHERE origen IN ('ajuste_positivo', 'ajuste_negativo');

ALTER TABLE movimientos_inventario
    DROP INDEX IF EXISTS idx_mov_producto_saldo;

SET @check_saldo := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'movimientos_inventario'
      AND CONSTRAINT_NAME = 'chk_mov_saldo_no_negativo'
);
SET @sql := IF(
    @check_saldo > 0,
    'ALTER TABLE movimientos_inventario DROP CONSTRAINT chk_mov_saldo_no_negativo',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE movimientos_inventario
    DROP COLUMN IF EXISTS motivo,
    DROP COLUMN IF EXISTS saldo_resultante,
    MODIFY COLUMN origen ENUM('compra','anulacion_compra','ajuste_manual','inventario_inicial','otro') NOT NULL DEFAULT 'otro';

SET @check_stock := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND CONSTRAINT_NAME = 'chk_productos_stock_no_negativo'
);
SET @sql := IF(
    @check_stock > 0,
    'ALTER TABLE productos DROP CONSTRAINT chk_productos_stock_no_negativo',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE productos
    DROP INDEX IF EXISTS uq_productos_codigo_barras,
    DROP COLUMN IF EXISTS imagen_mime,
    DROP COLUMN IF EXISTS imagen_miniatura,
    DROP COLUMN IF EXISTS imagen,
    DROP COLUMN IF EXISTS tipo,
    DROP COLUMN IF EXISTS codigo_barras;

-- Restaura el trigger original de 007_compras_triggers.sql.
DELIMITER $$

CREATE TRIGGER trg_movimientos_after_insert
AFTER INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_stock DECIMAL(12,3);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT stock_actual INTO v_stock
        FROM productos
        WHERE id = NEW.producto_id
        FOR UPDATE;

        IF v_stock IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto del movimiento no existe';
        END IF;

        IF NEW.tipo = 'salida' AND v_stock < NEW.cantidad THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para registrar la salida';
        END IF;

        IF NEW.tipo = 'entrada' THEN
            UPDATE productos
            SET stock_actual = stock_actual + NEW.cantidad,
                costo_ultimo = NEW.costo_unitario,
                costo_promedio = CASE
                    WHEN stock_actual + NEW.cantidad > 0 THEN
                        ROUND(((stock_actual * costo_promedio) + (NEW.cantidad * NEW.costo_unitario))
                              / (stock_actual + NEW.cantidad), 4)
                    ELSE NEW.costo_unitario
                END,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = NEW.producto_id;
        ELSE
            UPDATE productos
            SET stock_actual = stock_actual - NEW.cantidad,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id = NEW.producto_id;
        END IF;
    END IF;
END$$

DELIMITER ;
