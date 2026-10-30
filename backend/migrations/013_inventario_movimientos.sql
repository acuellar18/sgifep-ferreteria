-- 013_inventario_movimientos.sql
-- Fase 5 de Inventario: movimientos manuales (entradas, salidas y ajustes).
-- La tabla movimientos_inventario ya existe desde 006 y es el ledger de stock.
-- Aquí se agregan los datos que necesita la pantalla de Movimientos, se admite
-- el tipo 'ajuste' y se recrea el trigger que mantiene productos.stock_actual.
-- Idempotente para MariaDB 10.4+.

-- ============================================
-- 1. Columnas nuevas del ledger
-- ============================================
ALTER TABLE movimientos_inventario
    MODIFY COLUMN tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    ADD COLUMN IF NOT EXISTS stock_anterior DECIMAL(12,3) DEFAULT NULL AFTER cantidad,
    ADD COLUMN IF NOT EXISTS stock_nuevo DECIMAL(12,3) DEFAULT NULL AFTER stock_anterior,
    ADD COLUMN IF NOT EXISTS referencia VARCHAR(120) DEFAULT NULL AFTER motivo,
    ADD COLUMN IF NOT EXISTS observaciones VARCHAR(500) DEFAULT NULL AFTER referencia;

-- Completa stock_anterior/stock_nuevo en el historial existente.
SET @sgifep_reset = 1;
UPDATE movimientos_inventario
SET stock_nuevo = COALESCE(stock_nuevo, saldo_resultante),
    stock_anterior = COALESCE(
        stock_anterior,
        CASE
            WHEN tipo = 'entrada' THEN COALESCE(saldo_resultante, 0) - cantidad
            ELSE COALESCE(saldo_resultante, 0) + cantidad
        END
    )
WHERE stock_anterior IS NULL OR stock_nuevo IS NULL;
SET @sgifep_reset = NULL;

SET @check_stock_anterior := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'movimientos_inventario'
      AND CONSTRAINT_NAME = 'chk_mov_stock_anterior_no_negativo'
);
SET @sql := IF(
    @check_stock_anterior = 0,
    'ALTER TABLE movimientos_inventario ADD CONSTRAINT chk_mov_stock_anterior_no_negativo CHECK (stock_anterior IS NULL OR stock_anterior >= 0)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @check_stock_nuevo := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'movimientos_inventario'
      AND CONSTRAINT_NAME = 'chk_mov_stock_nuevo_no_negativo'
);
SET @sql := IF(
    @check_stock_nuevo = 0,
    'ALTER TABLE movimientos_inventario ADD CONSTRAINT chk_mov_stock_nuevo_no_negativo CHECK (stock_nuevo IS NULL OR stock_nuevo >= 0)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_inventario(creado_en);
CREATE INDEX IF NOT EXISTS idx_mov_tipo ON movimientos_inventario(tipo);

-- ============================================
-- 2. Trigger único de stock y costo
-- ============================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_movimientos_after_insert$$
DROP TRIGGER IF EXISTS trg_movimientos_before_insert$$

CREATE TRIGGER trg_movimientos_before_insert
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_tipo_producto VARCHAR(20);
    DECLARE v_stock DECIMAL(12,3);
    DECLARE v_promedio DECIMAL(12,4);
    DECLARE v_costo_ultimo DECIMAL(12,4);
    DECLARE v_nuevo_stock DECIMAL(12,3);
    DECLARE v_nuevo_promedio DECIMAL(12,4);
    DECLARE v_nuevo_costo_ultimo DECIMAL(12,4);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT tipo, stock_actual, costo_promedio, costo_ultimo
        INTO v_tipo_producto, v_stock, v_promedio, v_costo_ultimo
        FROM productos
        WHERE id = NEW.producto_id
        FOR UPDATE;

        IF v_stock IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto del movimiento no existe';
        END IF;
        IF v_tipo_producto = 'servicio' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los servicios no controlan existencias';
        END IF;
        IF NEW.cantidad < 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad del movimiento no puede ser negativa';
        END IF;

        SET NEW.stock_anterior = v_stock;

        IF NEW.tipo = 'ajuste' THEN
            -- En un ajuste, la cantidad recibida es el nuevo stock real.
            SET v_nuevo_stock = NEW.cantidad;
            IF v_nuevo_stock = v_stock THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nuevo stock debe ser diferente al stock actual';
            END IF;
            SET NEW.cantidad = ABS(v_nuevo_stock - v_stock);
        ELSE
            IF NEW.cantidad <= 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad del movimiento debe ser mayor a 0';
            END IF;

            IF NEW.tipo = 'entrada' THEN
                SET v_nuevo_stock = v_stock + NEW.cantidad;
            ELSE
                SET v_nuevo_stock = v_stock - NEW.cantidad;
            END IF;

            IF v_nuevo_stock < 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para registrar la salida';
            END IF;
        END IF;

        IF NEW.origen IN ('ajuste_manual', 'ajuste_positivo', 'ajuste_negativo', 'inventario_inicial')
           AND (NEW.motivo IS NULL OR TRIM(NEW.motivo) = '') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo del movimiento de inventario es requerido';
        END IF;

        SET v_nuevo_promedio = v_promedio;
        SET v_nuevo_costo_ultimo = v_costo_ultimo;

        IF NEW.tipo = 'entrada' THEN
            IF NEW.origen IN ('compra', 'inventario_inicial') THEN
                IF v_nuevo_stock > 0 THEN
                    SET v_nuevo_promedio = ROUND(
                        ((v_stock * v_promedio) + (NEW.cantidad * NEW.costo_unitario)) / v_nuevo_stock,
                        4
                    );
                ELSE
                    SET v_nuevo_promedio = NEW.costo_unitario;
                END IF;
                SET v_nuevo_costo_ultimo = NEW.costo_unitario;
            END IF;
        ELSE
            IF NEW.origen = 'anulacion_compra' THEN
                IF v_nuevo_stock <= 0 THEN
                    SET v_nuevo_promedio = 0;
                ELSE
                    SET v_nuevo_promedio = ROUND(
                        ((v_stock * v_promedio) - (NEW.cantidad * NEW.costo_unitario)) / v_nuevo_stock,
                        4
                    );
                    IF v_nuevo_promedio < 0 THEN
                        SET v_nuevo_promedio = 0;
                    END IF;
                END IF;

                SET v_nuevo_costo_ultimo = 0;
                SELECT dc.costo_unitario
                INTO v_nuevo_costo_ultimo
                FROM detalle_compra dc
                JOIN compras c ON c.id = dc.compra_id
                WHERE dc.producto_id = NEW.producto_id
                  AND c.estado = 'recibida'
                  AND NOT (NEW.referencia_tipo = 'compras' AND c.id = NEW.referencia_id)
                ORDER BY c.fecha DESC, c.id DESC, dc.id DESC
                LIMIT 1;
                SET v_nuevo_costo_ultimo = COALESCE(v_nuevo_costo_ultimo, 0);
            END IF;
        END IF;

        SET NEW.stock_nuevo = v_nuevo_stock;
        SET NEW.saldo_resultante = v_nuevo_stock;

        UPDATE productos
        SET stock_actual = v_nuevo_stock,
            costo_promedio = v_nuevo_promedio,
            costo_ultimo = v_nuevo_costo_ultimo,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = NEW.producto_id;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- Reversos
-- ============================================
-- DROP TRIGGER IF EXISTS trg_movimientos_before_insert;
-- Recrear el trigger de 011_inventario_servicios.sql.
-- ALTER TABLE movimientos_inventario DROP INDEX idx_mov_tipo;
-- ALTER TABLE movimientos_inventario DROP INDEX idx_mov_fecha;
-- ALTER TABLE movimientos_inventario
--     DROP CONSTRAINT chk_mov_stock_anterior_no_negativo,
--     DROP CONSTRAINT chk_mov_stock_nuevo_no_negativo,
--     DROP COLUMN observaciones,
--     DROP COLUMN referencia,
--     DROP COLUMN stock_nuevo,
--     DROP COLUMN stock_anterior,
--     MODIFY COLUMN tipo ENUM('entrada','salida') NOT NULL;
