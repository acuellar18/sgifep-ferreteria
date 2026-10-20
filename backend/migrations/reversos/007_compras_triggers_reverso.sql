-- Reverso de 007_compras_triggers.sql
-- Elimina triggers y procedimientos creados por la migración.

DELIMITER $$

DROP TRIGGER IF EXISTS trg_pagos_compra_before_insert$$
DROP TRIGGER IF EXISTS trg_pagos_compra_before_update$$
DROP TRIGGER IF EXISTS trg_pagos_compra_before_delete$$
DROP TRIGGER IF EXISTS trg_pagos_compra_after_insert$$
DROP TRIGGER IF EXISTS trg_pagos_compra_after_update$$
DROP TRIGGER IF EXISTS trg_compras_before_delete$$
DROP TRIGGER IF EXISTS trg_compras_before_update$$
DROP TRIGGER IF EXISTS trg_compras_after_insert$$
DROP TRIGGER IF EXISTS trg_compras_after_update$$
DROP TRIGGER IF EXISTS trg_compras_after_delete$$
DROP TRIGGER IF EXISTS trg_movimientos_before_update$$
DROP TRIGGER IF EXISTS trg_movimientos_before_delete$$
DROP TRIGGER IF EXISTS trg_movimientos_after_insert$$
DROP TRIGGER IF EXISTS trg_detalle_orden_after_insert$$
DROP TRIGGER IF EXISTS trg_detalle_orden_after_update$$
DROP TRIGGER IF EXISTS trg_detalle_orden_after_delete$$
DROP TRIGGER IF EXISTS trg_ordenes_after_insert$$
DROP TRIGGER IF EXISTS trg_ordenes_after_update$$
DROP TRIGGER IF EXISTS trg_ordenes_after_delete$$
DROP TRIGGER IF EXISTS trg_proveedores_after_insert$$
DROP TRIGGER IF EXISTS trg_proveedores_after_update$$
DROP TRIGGER IF EXISTS trg_proveedores_after_delete$$

DROP PROCEDURE IF EXISTS sp_recalcular_finanzas_compra$$
DROP PROCEDURE IF EXISTS sp_recalcular_totales_orden$$

DELIMITER ;
