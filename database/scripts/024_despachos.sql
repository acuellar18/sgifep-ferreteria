-- 024_despachos.sql
-- Listado de despachos, detalle y bitácora de cambios de estado
-- Importar con: mysql --default-character-set=utf8mb4 -u root -p sgifep_db < 024_despachos.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS despachos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  venta_id INT DEFAULT NULL,
  cliente_id INT DEFAULT NULL,
  direccion_entrega VARCHAR(500) DEFAULT NULL,
  telefono_contacto VARCHAR(50) DEFAULT NULL,
  fecha_programada DATE DEFAULT NULL,
  fecha_entregado DATETIME DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  estado ENUM('pendiente','programado','en_ruta','entregado','entrega_parcial','fallido','cancelado') NOT NULL DEFAULT 'pendiente',
  usuario_id INT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_fecha_programada (fecha_programada),
  INDEX idx_cliente (cliente_id),
  INDEX idx_venta (venta_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (venta_id) REFERENCES facturas(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS despacho_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  despacho_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  entregado INT NOT NULL DEFAULT 0,
  INDEX idx_despacho (despacho_id),
  FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS despacho_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  despacho_id INT NOT NULL,
  usuario_id INT DEFAULT NULL,
  de_estado VARCHAR(20) DEFAULT NULL,
  a_estado VARCHAR(20) NOT NULL,
  comentario TEXT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_despacho_hist (despacho_id, creado_en),
  FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
