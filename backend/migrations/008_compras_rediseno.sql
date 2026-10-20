-- 008_compras_rediseno.sql
-- Cierre del módulo de Compras: datos de proveedor, series de factura,
-- comentarios, archivos y configuración de la empresa emisora.
-- Idempotente para MariaDB 10.4+.

-- ============================================
-- 1. Datos adicionales del proveedor
-- ============================================
ALTER TABLE proveedores
    ADD COLUMN IF NOT EXISTS telefono2 VARCHAR(30) DEFAULT NULL AFTER telefono,
    ADD COLUMN IF NOT EXISTS dpi VARCHAR(20) DEFAULT NULL AFTER nit;

-- NIT único: solo se crea si la base actual no tiene duplicados.
SET @nit_duplicados := (
    SELECT COUNT(*) FROM (
        SELECT nit
        FROM proveedores
        WHERE nit IS NOT NULL AND nit <> ''
        GROUP BY nit
        HAVING COUNT(*) > 1
    ) duplicados
);
SET @nit_index := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'proveedores'
      AND INDEX_NAME = 'uq_proveedores_nit'
);
SET @sql := IF(
    @nit_duplicados = 0 AND @nit_index = 0,
    'ALTER TABLE proveedores ADD UNIQUE KEY uq_proveedores_nit (nit)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Serie de factura del proveedor
-- ============================================
ALTER TABLE compras
    ADD COLUMN IF NOT EXISTS serie VARCHAR(20) DEFAULT NULL AFTER numero_factura;

CREATE INDEX IF NOT EXISTS idx_compras_serie_factura ON compras(serie, numero_factura);

-- ============================================
-- 3. Comentarios de la compra
-- ============================================
CREATE TABLE IF NOT EXISTS compra_comentarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_comentarios_compra ON compra_comentarios(compra_id, creado_en);

-- ============================================
-- 4. Archivos adjuntos de la compra
-- ============================================
CREATE TABLE IF NOT EXISTS compra_archivos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_guardado VARCHAR(255) NOT NULL,
    mime VARCHAR(100) NOT NULL,
    tamano INT UNSIGNED NOT NULL,
    usuario_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_archivo_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_archivo_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_archivos_compra ON compra_archivos(compra_id, creado_en);

-- ============================================
-- 5. Configuración de la empresa emisora
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(20) DEFAULT NULL,
    direccion VARCHAR(300) DEFAULT NULL,
    telefono VARCHAR(40) DEFAULT NULL,
    correo VARCHAR(150) DEFAULT NULL,
    logo_url VARCHAR(300) DEFAULT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_config_empresa_unica CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO configuracion_empresa (id, nombre, nit, direccion, telefono, correo, logo_url)
VALUES (1, 'Ferretería El Puente', NULL, NULL, NULL, NULL, '/img/logo.png')
ON DUPLICATE KEY UPDATE id = id;

-- ============================================
-- Reversos
-- ============================================
-- DROP TABLE IF EXISTS compra_archivos;
-- DROP TABLE IF EXISTS compra_comentarios;
-- DROP TABLE IF EXISTS configuracion_empresa;
-- ALTER TABLE compras DROP COLUMN serie;
-- ALTER TABLE proveedores DROP COLUMN telefono2, DROP COLUMN dpi;
-- ALTER TABLE proveedores DROP INDEX uq_proveedores_nit;
