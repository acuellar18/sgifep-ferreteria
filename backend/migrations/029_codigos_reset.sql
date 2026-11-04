-- 029_codigos_reset.sql
-- Código de verificación (OTP de 6 dígitos) para el restablecimiento:
-- en la BD solo su HASH SHA-256; caduca en 15 min; máximo 5 intentos.
-- Importar con: mysql --default-character-set=utf8mb4 -u root -p sgifep_db < 029_codigos_reset.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_codigos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    codigo_hash CHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    intentos INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_codigo_hash (codigo_hash),
    INDEX idx_codigo_usuario (usuario_id, expira_en),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reversos (manuales):
-- DROP TABLE IF EXISTS password_reset_codigos;
