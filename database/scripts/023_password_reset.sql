-- 023_password_reset.sql
-- Recuperación de contraseña por token seguro (un uso, 30 min, hash SHA-256)
-- Importar con: mysql --default-character-set=utf8mb4 -u root -p sgifep_db < 023_password_reset.sql

SET NAMES utf8mb4;

-- 1) Asegurar columna email en usuarios (si no existe)
SET @col_email := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'email'
);
SET @sql_email := IF(
    @col_email = 0,
    'ALTER TABLE usuarios ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER nombre',
    'SELECT 1'
);
PREPARE stmt_email FROM @sql_email;
EXECUTE stmt_email;
DEALLOCATE PREPARE stmt_email;

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2) Tabla de tokens de restablecimiento
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_en DATETIME NOT NULL,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  INDEX idx_usuario_expira (usuario_id, expira_en),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_token_usado (token_hash, usado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
