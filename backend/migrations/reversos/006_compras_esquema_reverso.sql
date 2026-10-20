-- Reverso de 006_compras_esquema.sql
-- Elimina las estructuras agregadas y devuelve pagos_compra a pagos_proveedor.
-- ADVERTENCIA: elimina movimientos de inventario, secuencias y bitácora.

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

DROP TABLE IF EXISTS bitacora_auditoria;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS secuencias;

SET @fk_anulado_por := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pagos_compra'
      AND CONSTRAINT_NAME = 'fk_pagos_anulado_por'
);
SET @sql := IF(
    @fk_anulado_por > 0,
    'ALTER TABLE pagos_compra DROP FOREIGN KEY fk_pagos_anulado_por',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP INDEX IF EXISTS idx_pagos_compra_estado ON pagos_compra;
DROP INDEX IF EXISTS idx_pagos_anulado_por ON pagos_compra;

ALTER TABLE pagos_compra
    DROP COLUMN IF EXISTS estado,
    DROP COLUMN IF EXISTS anulado_en,
    DROP COLUMN IF EXISTS anulado_por,
    DROP COLUMN IF EXISTS anulacion_motivo,
    DROP COLUMN IF EXISTS actualizado_en;

SET @hay_pagos_nueva := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos_compra'
);
SET @hay_pagos_vieja := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos_proveedor'
);
SET @sql := IF(
    @hay_pagos_nueva > 0 AND @hay_pagos_vieja = 0,
    'RENAME TABLE pagos_compra TO pagos_proveedor',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
