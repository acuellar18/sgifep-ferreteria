-- 011_inventario_servicios.sql
-- Fase 4 de Inventario: los servicios no controlan existencias.
-- Recrea el trigger de movimientos para rechazar movimientos de stock de
-- productos con tipo 'servicio'. Los reportes y la API también los excluyen.

DELIMITER $$

DROP TRIGGER IF EXISTS trg_movimientos_before_insert$$

CREATE TRIGGER trg_movimientos_before_insert
BEFORE INSERT ON movimientos_inventario
FOR EACH ROW
BEGIN
    DECLARE v_tipo VARCHAR(20);
    DECLARE v_stock DECIMAL(12,3);
    DECLARE v_promedio DECIMAL(12,4);
    DECLARE v_costo_ultimo DECIMAL(12,4);
    DECLARE v_nuevo_stock DECIMAL(12,3);
    DECLARE v_nuevo_promedio DECIMAL(12,4);
    DECLARE v_nuevo_costo_ultimo DECIMAL(12,4);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT tipo, stock_actual, costo_promedio, costo_ultimo
        INTO v_tipo, v_stock, v_promedio, v_costo_ultimo
        FROM productos
        WHERE id = NEW.producto_id
        FOR UPDATE;

        IF v_stock IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto del movimiento no existe';
        END IF;
        IF v_tipo = 'servicio' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los servicios no controlan existencias';
        END IF;
        IF NEW.cantidad <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad del movimiento debe ser mayor a 0';
        END IF;
        IF NEW.tipo = 'salida' AND v_stock < NEW.cantidad THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para registrar la salida';
        END IF;
        IF NEW.origen IN ('ajuste_manual', 'ajuste_positivo', 'ajuste_negativo', 'inventario_inicial')
           AND (NEW.motivo IS NULL OR TRIM(NEW.motivo) = '') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo del movimiento de inventario es requerido';
        END IF;

        IF NEW.tipo = 'entrada' THEN
            SET v_nuevo_stock = v_stock + NEW.cantidad;
        ELSE
            SET v_nuevo_stock = v_stock - NEW.cantidad;
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

-- Reversos
-- DROP TRIGGER IF EXISTS trg_movimientos_before_insert;
-- Recrear el trigger de 009_inventario_esquema.sql sin la validación de servicios.
