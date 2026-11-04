-- 028_seguridad_login_reset.sql
-- Seguridad de acceso:
--   * password_resets ya existía vía database/scripts/023 (se garantiza aquí para BD nuevas).
--   * login_bloqueos: bloqueo temporal progresivo por fuerza bruta (usuario e IP).
--   * intentos_reset: registro de solicitudes de restablecimiento (fecha/IP/resultado).
--   * usuarios.sesiones_version: al cambiar la contraseña se incrementa y
--     todas las sesiones (JWT) activas quedan inválidas.
-- Idempotente y compatible con MySQL 8 (ALTER preparado, sin "ADD COLUMN IF NOT EXISTS").
-- Importar con: mysql --default-character-set=utf8mb4 -u root -p sgifep_db < 028_seguridad_login_reset.sql

SET NAMES utf8mb4;

-- 1) Tokens de restablecimiento (hash SHA-256, un uso, expiración 30 min)
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_usuario_expira (usuario_id, expira_en),
    INDEX idx_token_usado (token_hash, usado),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Bloqueos progresivos de login. La clave es "u:<username>" o "ip:<ip>";
--    separar usuario e IP evita que un atacante bloquee al dueño de una cuenta
--    desde otra IP y viceversa (el bloqueo es temporal, nunca definitivo).
CREATE TABLE IF NOT EXISTS login_bloqueos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(70) NOT NULL,
    intentos_consecutivos INT NOT NULL DEFAULT 0,
    nivel TINYINT NOT NULL DEFAULT 0, -- 0=5 min, 1=15, 2=30, 3=60 (máximo)
    bloqueado_hasta DATETIME NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_login_bloqueos_clave (clave),
    INDEX idx_login_bloqueos_hasta (bloqueado_hasta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Registro de solicitudes de restablecimiento (anti-enumeración: no guarda
--    el identificador escrito, solo IP, resultado y fecha).
CREATE TABLE IF NOT EXISTS intentos_reset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NULL,
    resultado VARCHAR(40) NOT NULL, -- enlace_enviado | datos_no_coinciden | sin_correo
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_intentos_reset_ip (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Columna de versión de sesiones (invalida JWT previos tras cambiar contraseña)
SET @col_version := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'sesiones_version'
);
SET @sql_version := IF(
    @col_version = 0,
    'ALTER TABLE usuarios ADD COLUMN sesiones_version INT NOT NULL DEFAULT 1',
    'SELECT 1'
);
PREPARE stmt_version FROM @sql_version;
EXECUTE stmt_version;
DEALLOCATE PREPARE stmt_version;

-- Reversos (manuales):
-- DROP TABLE IF EXISTS intentos_reset;
-- DROP TABLE IF EXISTS login_bloqueos;
-- DROP TABLE IF EXISTS password_resets;
-- ALTER TABLE usuarios DROP COLUMN sesiones_version;
