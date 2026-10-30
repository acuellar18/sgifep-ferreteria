-- 016_perfil_caja.sql
-- Perfil del usuario (correo y foto) y sesiones de apertura/cierre de caja.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

-- ============================================
-- 1. Datos de perfil en usuarios
-- ============================================
SET @existe_correo := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'correo'
);
SET @sql := IF(
    @existe_correo = 0,
    'ALTER TABLE usuarios ADD COLUMN correo VARCHAR(150) DEFAULT NULL AFTER username',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe_foto := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'foto'
);
SET @sql := IF(
    @existe_foto = 0,
    'ALTER TABLE usuarios ADD COLUMN foto VARCHAR(255) DEFAULT NULL AFTER correo',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe_foto_mime := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuarios'
      AND COLUMN_NAME = 'foto_mime'
);
SET @sql := IF(
    @existe_foto_mime = 0,
    'ALTER TABLE usuarios ADD COLUMN foto_mime VARCHAR(50) DEFAULT NULL AFTER foto',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Sesiones de caja
-- ============================================
CREATE TABLE IF NOT EXISTS sesiones_caja (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL DEFAULT NULL,
    ventas_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    ventas_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0,
    ventas_count INT NOT NULL DEFAULT 0,
    efectivo_esperado DECIMAL(12,2) NOT NULL DEFAULT 0,
    monto_contado DECIMAL(12,2) DEFAULT NULL,
    diferencia DECIMAL(12,2) DEFAULT NULL,
    observaciones VARCHAR(500) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sesiones_caja_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_sesiones_caja_usuario_estado (usuario_id, estado),
    INDEX idx_sesiones_caja_apertura (fecha_apertura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reversos
-- DROP TABLE IF EXISTS sesiones_caja;
-- ALTER TABLE usuarios DROP COLUMN foto_mime, DROP COLUMN foto, DROP COLUMN correo;
