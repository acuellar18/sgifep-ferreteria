-- 007_compras_triggers.sql
-- Fase 1: reglas de integridad de Compras, stock y auditoría.
-- Los triggers se recrean en cada ejecución para mantener una única versión.
--
-- Convención de sesión:
--   @usuario_id    -> usuario que ejecuta la operación (auditoría).
--   @sgifep_reset  -> 1 durante el reinicio de datos demo para omitir bloqueos.

DELIMITER $$

-- ============================================
-- Procedimientos de recálculo
-- ============================================
DROP PROCEDURE IF EXISTS sp_recalcular_finanzas_compra$$
CREATE PROCEDURE sp_recalcular_finanzas_compra(IN p_compra_id INT)
BEGIN
    UPDATE compras c
    SET c.monto_pagado = COALESCE((
            SELECT SUM(p.monto)
            FROM pagos_compra p
            WHERE p.compra_id = c.id AND p.estado = 'activo'
        ), 0),
        c.saldo_pendiente = GREATEST(0, c.total - COALESCE((
            SELECT SUM(p.monto)
            FROM pagos_compra p
            WHERE p.compra_id = c.id AND p.estado = 'activo'
        ), 0)),
        c.estado_pago = CASE
            WHEN c.total - COALESCE((
                SELECT SUM(p.monto)
                FROM pagos_compra p
                WHERE p.compra_id = c.id AND p.estado = 'activo'
            ), 0) <= 0.01 THEN 'pagada'
            WHEN COALESCE((
                SELECT SUM(p.monto)
                FROM pagos_compra p
                WHERE p.compra_id = c.id AND p.estado = 'activo'
            ), 0) > 0 THEN 'parcial'
            ELSE 'pendiente'
        END,
        c.actualizado_en = CURRENT_TIMESTAMP
    WHERE c.id = p_compra_id AND c.estado = 'recibida';
END$$

DROP PROCEDURE IF EXISTS sp_recalcular_totales_orden$$
CREATE PROCEDURE sp_recalcular_totales_orden(IN p_orden_id INT)
BEGIN
    UPDATE ordenes_compra oc
    LEFT JOIN (
        SELECT orden_id,
               ROUND(COALESCE(SUM(cantidad_solicitada * costo_estimado), 0), 2) AS subtotal,
               ROUND(COALESCE(SUM(cantidad_solicitada * costo_estimado), 0) * 0.12, 2) AS iva
        FROM detalle_orden_compra
        WHERE orden_id = p_orden_id
        GROUP BY orden_id
    ) t ON t.orden_id = oc.id
    SET oc.subtotal_estimado = COALESCE(t.subtotal, 0),
        oc.iva_estimado = COALESCE(t.iva, 0),
        oc.total_estimado = ROUND(COALESCE(t.subtotal, 0) + COALESCE(t.iva, 0), 2),
        oc.actualizado_en = CURRENT_TIMESTAMP
    WHERE oc.id = p_orden_id;
END$$

-- ============================================
-- Pagos: validación, recálculo y anulación lógica
-- ============================================
DROP TRIGGER IF EXISTS trg_pagos_compra_before_insert$$
CREATE TRIGGER trg_pagos_compra_before_insert
BEFORE INSERT ON pagos_compra
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_estado_compra VARCHAR(20);
    DECLARE v_pagado DECIMAL(14,2);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SELECT total, estado INTO v_total, v_estado_compra
        FROM compras WHERE id = NEW.compra_id;

        IF v_total IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La compra del pago no existe';
        END IF;
        IF v_estado_compra = 'anulada' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden registrar pagos en una compra anulada';
        END IF;
        IF NEW.monto <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto del pago debe ser mayor a 0';
        END IF;

        SELECT COALESCE(SUM(monto), 0) INTO v_pagado
        FROM pagos_compra
        WHERE compra_id = NEW.compra_id AND estado = 'activo';

        IF v_pagado + NEW.monto > v_total + 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El pago excede el saldo pendiente de la compra';
        END IF;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_pagos_compra_before_update$$
CREATE TRIGGER trg_pagos_compra_before_update
BEFORE UPDATE ON pagos_compra
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(14,2);
    DECLARE v_estado_compra VARCHAR(20);
    DECLARE v_pagado DECIMAL(14,2);

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF NEW.compra_id <> OLD.compra_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cambiar la compra de un pago';
        END IF;
        IF NEW.monto <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El monto del pago debe ser mayor a 0';
        END IF;
        IF OLD.estado = 'anulado' AND NEW.estado = 'activo' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede reactivar un pago anulado';
        END IF;
        IF NEW.estado = 'anulado' AND OLD.estado <> 'anulado' THEN
            IF NEW.anulacion_motivo IS NULL OR TRIM(NEW.anulacion_motivo) = '' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo de anulación del pago es requerido';
            END IF;
            IF NEW.anulado_por IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que anula el pago es requerido';
            END IF;
        END IF;

        SELECT total, estado INTO v_total, v_estado_compra
        FROM compras WHERE id = NEW.compra_id;

        IF v_estado_compra = 'anulada' AND NEW.estado = 'activo' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden modificar pagos activos de una compra anulada';
        END IF;

        SELECT COALESCE(SUM(monto), 0) INTO v_pagado
        FROM pagos_compra
        WHERE compra_id = NEW.compra_id AND estado = 'activo';

        IF OLD.estado = 'activo' THEN
            SET v_pagado = GREATEST(0, v_pagado - OLD.monto);
        END IF;
        IF NEW.estado = 'activo' THEN
            SET v_pagado = v_pagado + NEW.monto;
        END IF;

        IF v_pagado > v_total + 0.01 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los pagos activos exceden el total de la compra';
        END IF;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_pagos_compra_before_delete$$
CREATE TRIGGER trg_pagos_compra_before_delete
BEFORE DELETE ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se permite eliminar pagos; use la anulación lógica';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_pagos_compra_after_insert$$
CREATE TRIGGER trg_pagos_compra_after_insert
AFTER INSERT ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_finanzas_compra(NEW.compra_id);
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'pagos_compra', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'compra_id', NEW.compra_id,
                'fecha', NEW.fecha,
                'monto', NEW.monto,
                'metodo', NEW.metodo,
                'referencia', NEW.referencia,
                'estado', NEW.estado,
                'usuario_id', NEW.usuario_id
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_pagos_compra_after_update$$
CREATE TRIGGER trg_pagos_compra_after_update
AFTER UPDATE ON pagos_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_finanzas_compra(NEW.compra_id);
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'pagos_compra', NEW.id,
             IF(NEW.estado = 'anulado' AND OLD.estado = 'activo', 'anular', 'actualizar'),
             JSON_OBJECT(
                'id', OLD.id,
                'compra_id', OLD.compra_id,
                'fecha', OLD.fecha,
                'monto', OLD.monto,
                'metodo', OLD.metodo,
                'referencia', OLD.referencia,
                'estado', OLD.estado,
                'anulacion_motivo', OLD.anulacion_motivo
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'compra_id', NEW.compra_id,
                'fecha', NEW.fecha,
                'monto', NEW.monto,
                'metodo', NEW.metodo,
                'referencia', NEW.referencia,
                'estado', NEW.estado,
                'anulacion_motivo', NEW.anulacion_motivo
             ));
    END IF;
END$$

-- ============================================
-- Compras: bloqueo de borrado y anulación controlada
-- ============================================
DROP TRIGGER IF EXISTS trg_compras_before_delete$$
CREATE TRIGGER trg_compras_before_delete
BEFORE DELETE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se permite eliminar compras; use la anulación';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_compras_before_update$$
CREATE TRIGGER trg_compras_before_update
BEFORE UPDATE ON compras
FOR EACH ROW
BEGIN
    DECLARE v_pagos_activos INT;

    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF OLD.estado = 'anulada' AND NEW.estado <> 'anulada' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede reactivar una compra anulada';
        END IF;

        IF NEW.estado = 'anulada' AND OLD.estado <> 'anulada' THEN
            IF NEW.anulacion_motivo IS NULL OR TRIM(NEW.anulacion_motivo) = '' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El motivo de anulación de la compra es requerido';
            END IF;
            IF NEW.anulada_por IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario que anula la compra es requerido';
            END IF;

            SELECT COUNT(*) INTO v_pagos_activos
            FROM pagos_compra
            WHERE compra_id = NEW.id AND estado = 'activo';

            IF v_pagos_activos > 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede anular una compra con pagos activos';
            END IF;

            SET NEW.monto_pagado = 0;
            SET NEW.saldo_pendiente = 0;
            SET NEW.estado_pago = 'pagada';
        END IF;
    END IF;
END$$

-- ============================================
-- Auditoría de compras
-- ============================================
DROP TRIGGER IF EXISTS trg_compras_after_insert$$
CREATE TRIGGER trg_compras_after_insert
AFTER INSERT ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'compras', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'fecha', NEW.fecha,
                'total', NEW.total,
                'estado', NEW.estado,
                'estado_pago', NEW.estado_pago
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_compras_after_update$$
CREATE TRIGGER trg_compras_after_update
AFTER UPDATE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'compras', NEW.id,
             IF(NEW.estado = 'anulada' AND OLD.estado <> 'anulada', 'anular', 'actualizar'),
             JSON_OBJECT(
                'id', OLD.id,
                'numero', OLD.numero,
                'proveedor_id', OLD.proveedor_id,
                'total', OLD.total,
                'monto_pagado', OLD.monto_pagado,
                'saldo_pendiente', OLD.saldo_pendiente,
                'estado', OLD.estado,
                'estado_pago', OLD.estado_pago
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'total', NEW.total,
                'monto_pagado', NEW.monto_pagado,
                'saldo_pendiente', NEW.saldo_pendiente,
                'estado', NEW.estado,
                'estado_pago', NEW.estado_pago
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_compras_after_delete$$
CREATE TRIGGER trg_compras_after_delete
AFTER DELETE ON compras
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, OLD.usuario_id), 'compras', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'numero', OLD.numero, 'total', OLD.total),
             NULL);
    END IF;
END$$

-- ============================================
-- Inventario: el ledger es la única fuente de stock
-- ============================================
DROP TRIGGER IF EXISTS trg_movimientos_before_update$$
CREATE TRIGGER trg_movimientos_before_update
BEFORE UPDATE ON movimientos_inventario
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos de inventario no se pueden modificar';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_movimientos_before_delete$$
CREATE TRIGGER trg_movimientos_before_delete
BEFORE DELETE ON movimientos_inventario
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los movimientos de inventario no se pueden eliminar';
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_movimientos_after_insert$$
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

-- ============================================
-- Totales estimados de órdenes de compra
-- ============================================
DROP TRIGGER IF EXISTS trg_detalle_orden_after_insert$$
CREATE TRIGGER trg_detalle_orden_after_insert
AFTER INSERT ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_totales_orden(NEW.orden_id);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_detalle_orden_after_update$$
CREATE TRIGGER trg_detalle_orden_after_update
AFTER UPDATE ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        IF NEW.orden_id <> OLD.orden_id THEN
            CALL sp_recalcular_totales_orden(OLD.orden_id);
        END IF;
        CALL sp_recalcular_totales_orden(NEW.orden_id);
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_detalle_orden_after_delete$$
CREATE TRIGGER trg_detalle_orden_after_delete
AFTER DELETE ON detalle_orden_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        CALL sp_recalcular_totales_orden(OLD.orden_id);
    END IF;
END$$

-- ============================================
-- Auditoría de órdenes de compra
-- ============================================
DROP TRIGGER IF EXISTS trg_ordenes_after_insert$$
CREATE TRIGGER trg_ordenes_after_insert
AFTER INSERT ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id), 'ordenes_compra', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'estado', NEW.estado,
                'total_estimado', NEW.total_estimado
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_ordenes_after_update$$
CREATE TRIGGER trg_ordenes_after_update
AFTER UPDATE ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, NEW.usuario_id, OLD.usuario_id), 'ordenes_compra', NEW.id, 'actualizar',
             JSON_OBJECT(
                'id', OLD.id,
                'numero', OLD.numero,
                'proveedor_id', OLD.proveedor_id,
                'estado', OLD.estado,
                'total_estimado', OLD.total_estimado
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'numero', NEW.numero,
                'proveedor_id', NEW.proveedor_id,
                'estado', NEW.estado,
                'total_estimado', NEW.total_estimado
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_ordenes_after_delete$$
CREATE TRIGGER trg_ordenes_after_delete
AFTER DELETE ON ordenes_compra
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (COALESCE(@usuario_id, OLD.usuario_id), 'ordenes_compra', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'numero', OLD.numero, 'total_estimado', OLD.total_estimado),
             NULL);
    END IF;
END$$

-- ============================================
-- Auditoría de proveedores
-- ============================================
DROP TRIGGER IF EXISTS trg_proveedores_after_insert$$
CREATE TRIGGER trg_proveedores_after_insert
AFTER INSERT ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', NEW.id, 'crear', NULL,
             JSON_OBJECT(
                'id', NEW.id,
                'nombre', NEW.nombre,
                'nit', NEW.nit,
                'activo', NEW.activo
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_proveedores_after_update$$
CREATE TRIGGER trg_proveedores_after_update
AFTER UPDATE ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', NEW.id, 'actualizar',
             JSON_OBJECT(
                'id', OLD.id,
                'nombre', OLD.nombre,
                'nit', OLD.nit,
                'activo', OLD.activo
             ),
             JSON_OBJECT(
                'id', NEW.id,
                'nombre', NEW.nombre,
                'nit', NEW.nit,
                'activo', NEW.activo
             ));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_proveedores_after_delete$$
CREATE TRIGGER trg_proveedores_after_delete
AFTER DELETE ON proveedores
FOR EACH ROW
BEGIN
    IF COALESCE(@sgifep_reset, 0) <> 1 THEN
        INSERT INTO bitacora_auditoria
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos)
        VALUES
            (@usuario_id, 'proveedores', OLD.id, 'eliminar',
             JSON_OBJECT('id', OLD.id, 'nombre', OLD.nombre, 'nit', OLD.nit),
             NULL);
    END IF;
END$$

DELIMITER ;
