-- 006_compras_esquema.sql
-- Fase 1: esquema de integridad para el módulo de Compras.
-- Idempotente. Pensado para MariaDB 10.4+ (entorno actual del proyecto).

-- ============================================
-- 1. Renombrar pagos_proveedor -> pagos_compra
-- ============================================
SET @hay_pagos_vieja := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos_proveedor'
);
SET @hay_pagos_nueva := (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos_compra'
);
SET @sql := IF(
    @hay_pagos_vieja > 0 AND @hay_pagos_nueva = 0,
    'RENAME TABLE pagos_proveedor TO pagos_compra',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Instalaciones nuevas: 005 ya no crea la tabla de pagos.
CREATE TABLE IF NOT EXISTS pagos_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    monto DECIMAL(14,2) NOT NULL,
    metodo ENUM('efectivo','transferencia','cheque','otro') NOT NULL DEFAULT 'efectivo',
    referencia VARCHAR(100) DEFAULT NULL,
    notas VARCHAR(255) DEFAULT NULL,
    usuario_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_pagos_compra ON pagos_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos_compra(fecha);

-- ============================================
-- 2. Anulación lógica de pagos
-- ============================================
ALTER TABLE pagos_compra
    ADD COLUMN IF NOT EXISTS estado ENUM('activo','anulado') NOT NULL DEFAULT 'activo' AFTER usuario_id,
    ADD COLUMN IF NOT EXISTS anulado_en TIMESTAMP NULL DEFAULT NULL AFTER estado,
    ADD COLUMN IF NOT EXISTS anulado_por INT DEFAULT NULL AFTER anulado_en,
    ADD COLUMN IF NOT EXISTS anulacion_motivo VARCHAR(255) DEFAULT NULL AFTER anulado_por,
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER creado_en;

CREATE INDEX IF NOT EXISTS idx_pagos_compra_estado ON pagos_compra(compra_id, estado);
CREATE INDEX IF NOT EXISTS idx_pagos_anulado_por ON pagos_compra(anulado_por);

SET @fk_anulado_por := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pagos_compra'
      AND CONSTRAINT_NAME = 'fk_pagos_anulado_por'
);
SET @sql := IF(
    @fk_anulado_por = 0,
    'ALTER TABLE pagos_compra ADD CONSTRAINT fk_pagos_anulado_por FOREIGN KEY (anulado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Movimientos de inventario (ledger de stock)
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo ENUM('entrada','salida') NOT NULL,
    origen ENUM('compra','anulacion_compra','ajuste_manual','inventario_inicial','otro') NOT NULL DEFAULT 'otro',
    referencia_tipo VARCHAR(30) DEFAULT NULL,
    referencia_id INT DEFAULT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    notas VARCHAR(255) DEFAULT NULL,
    usuario_id INT DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_mov_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_mov_producto_fecha ON movimientos_inventario(producto_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_mov_referencia ON movimientos_inventario(referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_mov_origen ON movimientos_inventario(origen);
CREATE INDEX IF NOT EXISTS idx_mov_usuario ON movimientos_inventario(usuario_id);

-- ============================================
-- 4. Secuencias de numeración por año
-- ============================================
CREATE TABLE IF NOT EXISTS secuencias (
    nombre VARCHAR(40) NOT NULL,
    anio SMALLINT UNSIGNED NOT NULL,
    valor BIGINT UNSIGNED NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (nombre, anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inicializar con los correlativos existentes (si hay datos).
INSERT INTO secuencias (nombre, anio, valor)
SELECT 'compras', CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED),
       MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED))
FROM compras
WHERE numero REGEXP '^C-[0-9]{4}-[0-9]+$'
GROUP BY CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED)
ON DUPLICATE KEY UPDATE valor = GREATEST(secuencias.valor, VALUES(valor));

INSERT INTO secuencias (nombre, anio, valor)
SELECT 'ordenes_compra', CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED),
       MAX(CAST(SUBSTRING(numero, 9) AS UNSIGNED))
FROM ordenes_compra
WHERE numero REGEXP '^OC-[0-9]{4}-[0-9]+$'
GROUP BY CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED)
ON DUPLICATE KEY UPDATE valor = GREATEST(secuencias.valor, VALUES(valor));

-- ============================================
-- 5. Bitácora de auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    tabla VARCHAR(60) NOT NULL,
    registro_id BIGINT DEFAULT NULL,
    accion ENUM('crear','actualizar','anular','eliminar') NOT NULL,
    datos_anteriores JSON DEFAULT NULL,
    datos_nuevos JSON DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_bitacora_tabla_registro ON bitacora_auditoria(tabla, registro_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_auditoria(creado_en);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario ON bitacora_auditoria(usuario_id);
