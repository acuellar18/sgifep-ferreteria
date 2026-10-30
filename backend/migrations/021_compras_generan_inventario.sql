-- 021_compras_generan_inventario.sql
-- Ajustes para que el inventario sea consecuencia de las compras.
-- Idempotente.

-- 1) Asegurar proveedor_id en productos (proveedor principal / última compra)
SET @col_prov := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'proveedor_id'
);
SET @sql := IF(
    @col_prov = 0,
    'ALTER TABLE productos ADD COLUMN proveedor_id INT DEFAULT NULL AFTER categoria_id, ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);

-- 2) Añadir precio_venta a detalle_compra si no existe (trazabilidad)
SET @col_pv_det := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalle_compra' AND COLUMN_NAME = 'precio_venta'
);
SET @sql := IF(
    @col_pv_det = 0,
    'ALTER TABLE detalle_compra ADD COLUMN precio_venta DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER costo_unitario',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
