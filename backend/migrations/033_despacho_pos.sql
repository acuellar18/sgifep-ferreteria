-- 033_despacho_pos.sql
-- Despacho desde el POS + entrega a domicilio + cobro contra entrega.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

-- ============================================
-- 1. Columnas de despachos (asignación y entrega)
-- ============================================
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'responsable_id'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN responsable_id INT DEFAULT NULL AFTER usuario_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'tipo_vehiculo'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN tipo_vehiculo ENUM(''mototaxi'',''motocicleta'',''carro'',''pickup'') DEFAULT NULL AFTER responsable_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'placa_vehiculo'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN placa_vehiculo VARCHAR(20) DEFAULT NULL AFTER tipo_vehiculo',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'fecha_asignacion'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN fecha_asignacion DATETIME DEFAULT NULL AFTER placa_vehiculo',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'recibido_por'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN recibido_por VARCHAR(100) DEFAULT NULL AFTER fecha_entregado',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'forma_pago'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN forma_pago ENUM(''contado'',''credito'',''contra_entrega'') NOT NULL DEFAULT ''contado'' AFTER estado',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'costo_envio'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN costo_envio DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER forma_pago',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'requiere_revision'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE despachos ADD COLUMN requiere_revision TINYINT(1) NOT NULL DEFAULT 0 AFTER costo_envio',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK responsable -> usuarios (si no existe)
SET @existe_fk := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'despachos'
      AND CONSTRAINT_NAME = 'fk_despachos_responsable'
);
SET @sql := IF(
    @existe_fk = 0,
    'ALTER TABLE despachos ADD CONSTRAINT fk_despachos_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Facturas: flag contra entrega + costo de envío
-- ============================================
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facturas' AND COLUMN_NAME = 'contra_entrega'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE facturas ADD COLUMN contra_entrega TINYINT(1) NOT NULL DEFAULT 0 AFTER condicion',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facturas' AND COLUMN_NAME = 'costo_envio'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE facturas ADD COLUMN costo_envio DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER total',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Ventas: costo de envío
-- ============================================
SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = 'costo_envio'
);
SET @sql := IF(
    @existe = 0,
    'ALTER TABLE ventas ADD COLUMN costo_envio DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER descuento',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. Estados de despacho: agregar asignado y no_entregado
--    (se conservan programado/fallido en el ENUM para idempotencia del mapeo)
-- ============================================
SET @estado_enum := (
    SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'despachos' AND COLUMN_NAME = 'estado'
);
SET @sql := IF(
    @estado_enum NOT LIKE '%''asignado''%' OR @estado_enum NOT LIKE '%''no_entregado''%',
    'ALTER TABLE despachos MODIFY COLUMN estado ENUM(''pendiente'',''asignado'',''en_ruta'',''entregado'',''no_entregado'',''entrega_parcial'',''cancelado'',''programado'',''fallido'') NOT NULL DEFAULT ''pendiente''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Mapeo de estados antiguos (sin perder información; el historial queda)
--    programado -> pendiente ; fallido -> no_entregado
-- ============================================
UPDATE despachos SET estado = 'pendiente' WHERE estado = 'programado';
UPDATE despachos SET estado = 'no_entregado' WHERE estado = 'fallido';
