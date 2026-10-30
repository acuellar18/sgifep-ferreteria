-- 020_mejoras_pos.sql
-- Mejoras del POS: cobros de crédito, devoluciones parciales, arqueo de caja
-- por denominaciones y auditoría de acciones sensibles.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

-- ============================================
-- 1. Cobros: caja y notas
-- ============================================
SET @existe_cobros_caja := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cobros' AND COLUMN_NAME = 'caja_id'
);
SET @sql := IF(
    @existe_cobros_caja = 0,
    'ALTER TABLE cobros ADD COLUMN caja_id BIGINT DEFAULT NULL AFTER usuario_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_cobros_notas := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cobros' AND COLUMN_NAME = 'notas'
);
SET @sql := IF(
    @existe_cobros_notas = 0,
    'ALTER TABLE cobros ADD COLUMN notas VARCHAR(255) DEFAULT NULL AFTER referencia',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_cobros_fk_caja := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cobros'
      AND CONSTRAINT_NAME = 'fk_cobros_caja'
);
SET @sql := IF(
    @existe_cobros_fk_caja = 0,
    'ALTER TABLE cobros ADD CONSTRAINT fk_cobros_caja FOREIGN KEY (caja_id) REFERENCES sesiones_caja(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Sesiones de caja: cobros, devoluciones y arqueo
-- ============================================
SET @columnas_caja := (
    SELECT GROUP_CONCAT(COLUMN_NAME)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sesiones_caja'
);

SET @sql := IF(
    FIND_IN_SET('cobros_total', @columnas_caja) = 0,
    'ALTER TABLE sesiones_caja
       ADD COLUMN cobros_total DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER ventas_count,
       ADD COLUMN cobros_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cobros_total,
       ADD COLUMN cobros_tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cobros_efectivo,
       ADD COLUMN cobros_transferencia DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cobros_tarjeta,
       ADD COLUMN devoluciones_total DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER cobros_transferencia,
       ADD COLUMN devoluciones_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER devoluciones_total,
       ADD COLUMN devoluciones_tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER devoluciones_efectivo,
       ADD COLUMN devoluciones_transferencia DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER devoluciones_tarjeta',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columnas_caja := (
    SELECT GROUP_CONCAT(COLUMN_NAME)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sesiones_caja'
);
SET @sql := IF(
    FIND_IN_SET('arqueo_detalle', @columnas_caja) = 0,
    'ALTER TABLE sesiones_caja
       ADD COLUMN arqueo_detalle LONGTEXT DEFAULT NULL AFTER devoluciones_transferencia,
       ADD COLUMN monto_contado_tarjeta DECIMAL(12,2) DEFAULT NULL AFTER arqueo_detalle,
       ADD COLUMN monto_contado_transferencia DECIMAL(12,2) DEFAULT NULL AFTER monto_contado_tarjeta',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columnas_caja := (
    SELECT GROUP_CONCAT(COLUMN_NAME)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sesiones_caja'
);
SET @sql := IF(
    FIND_IN_SET('cobros_count', @columnas_caja) = 0,
    'ALTER TABLE sesiones_caja
       ADD COLUMN cobros_count INT NOT NULL DEFAULT 0 AFTER cobros_transferencia',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columnas_caja := (
    SELECT GROUP_CONCAT(COLUMN_NAME)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sesiones_caja'
);
SET @sql := IF(
    FIND_IN_SET('devoluciones_count', @columnas_caja) = 0,
    'ALTER TABLE sesiones_caja
       ADD COLUMN devoluciones_count INT NOT NULL DEFAULT 0 AFTER devoluciones_transferencia',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Devoluciones parciales de ventas
-- ============================================
ALTER TABLE movimientos_inventario
    MODIFY COLUMN origen ENUM(
        'compra',
        'anulacion_compra',
        'ajuste_manual',
        'ajuste_positivo',
        'ajuste_negativo',
        'inventario_inicial',
        'venta',
        'anulacion_venta',
        'devolucion_venta',
        'otro'
    ) NOT NULL DEFAULT 'otro';

CREATE TABLE IF NOT EXISTS devoluciones_venta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    venta_id BIGINT NOT NULL,
    factura_id BIGINT DEFAULT NULL,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    caja_id BIGINT DEFAULT NULL,
    tipo ENUM('reembolso', 'nota_credito') NOT NULL DEFAULT 'reembolso',
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito') NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devoluciones_venta_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_venta_factura FOREIGN KEY (factura_id)
        REFERENCES facturas(id) ON DELETE SET NULL,
    CONSTRAINT fk_devoluciones_venta_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_venta_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_devoluciones_venta_caja FOREIGN KEY (caja_id)
        REFERENCES sesiones_caja(id) ON DELETE SET NULL,
    INDEX idx_devoluciones_venta_venta (venta_id),
    INDEX idx_devoluciones_venta_fecha (creado_en),
    INDEX idx_devoluciones_venta_caja (caja_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_devolucion_venta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    devolucion_id BIGINT NOT NULL,
    detalle_venta_id BIGINT NOT NULL,
    producto_id INT NOT NULL,
    producto_codigo VARCHAR(30) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(14,2) NOT NULL,
    costo_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    CONSTRAINT fk_detalle_devolucion_devolucion FOREIGN KEY (devolucion_id)
        REFERENCES devoluciones_venta(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_devolucion_detalle FOREIGN KEY (detalle_venta_id)
        REFERENCES detalle_venta(id) ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_devolucion_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_devolucion_cantidad CHECK (cantidad > 0),
    INDEX idx_detalle_devolucion_devolucion (devolucion_id),
    INDEX idx_detalle_devolucion_detalle (detalle_venta_id),
    INDEX idx_detalle_devolucion_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Auditoría e intentos de acceso
-- ============================================
CREATE TABLE IF NOT EXISTS auditoria_eventos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    username VARCHAR(50) DEFAULT NULL,
    accion VARCHAR(80) NOT NULL,
    entidad VARCHAR(60) DEFAULT NULL,
    entidad_id VARCHAR(60) DEFAULT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    datos LONGTEXT DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_auditoria_fecha (creado_en),
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_accion (accion),
    INDEX idx_auditoria_entidad (entidad, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intentos_login (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    exito TINYINT(1) NOT NULL DEFAULT 0,
    motivo VARCHAR(120) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intentos_login_fecha (creado_en),
    INDEX idx_intentos_login_usuario_ip (username, ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Permisos nuevos
-- ============================================
INSERT INTO permisos (clave, nombre, descripcion, modulo) VALUES
    ('facturacion.cobros.devolver', 'Registrar devoluciones',
     'Registrar devoluciones parciales de ventas y devolver inventario.', 'facturacion'),
    ('seguridad.auditoria.ver', 'Ver auditoría',
     'Consultar el registro de acciones sensibles del sistema.', 'seguridad')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave IN ('facturacion.cobros.devolver', 'seguridad.auditoria.ver')
WHERE r.nombre = 'administrador'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave = 'facturacion.cobros.devolver'
WHERE r.nombre IN ('caja', 'ventas')
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- ============================================
-- 6. Índices de consulta
-- ============================================
SET @existe_indice := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cobros' AND INDEX_NAME = 'idx_cobros_caja_fecha'
);
SET @sql := IF(
    @existe_indice = 0,
    'CREATE INDEX idx_cobros_caja_fecha ON cobros(caja_id, creado_en)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_indice := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cobros' AND INDEX_NAME = 'idx_cobros_factura_estado'
);
SET @sql := IF(
    @existe_indice = 0,
    'CREATE INDEX idx_cobros_factura_estado ON cobros(factura_id, estado)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @existe_indice := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND INDEX_NAME = 'idx_ventas_fecha_estado_metodo'
);
SET @sql := IF(
    @existe_indice = 0,
    'CREATE INDEX idx_ventas_fecha_estado_metodo ON ventas(creado_en, estado, metodo_pago)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Reversos:
-- DROP TABLE IF EXISTS detalle_devolucion_venta;
-- DROP TABLE IF EXISTS devoluciones_venta;
-- DROP TABLE IF EXISTS intentos_login;
-- DROP TABLE IF EXISTS auditoria_eventos;
-- ALTER TABLE sesiones_caja
--   DROP COLUMN monto_contado_transferencia, DROP COLUMN monto_contado_tarjeta,
--   DROP COLUMN arqueo_detalle, DROP COLUMN devoluciones_transferencia,
--   DROP COLUMN devoluciones_tarjeta, DROP COLUMN devoluciones_efectivo,
--   DROP COLUMN devoluciones_total, DROP COLUMN cobros_transferencia,
--   DROP COLUMN cobros_tarjeta, DROP COLUMN cobros_efectivo, DROP COLUMN cobros_total;
-- ALTER TABLE cobros DROP FOREIGN KEY fk_cobros_caja, DROP COLUMN notas, DROP COLUMN caja_id;
