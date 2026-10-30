-- 025_rutas_entregas.sql
-- Rutas, entregas y catálogos de conductores/vehículos
-- Importar con: mysql --default-character-set=utf8mb4 -u root -p sgifep_db < 025_rutas_entregas.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS conductores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(20) NOT NULL UNIQUE,
  descripcion VARCHAR(200) DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rutas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  conductor_id INT DEFAULT NULL,
  vehiculo_id INT DEFAULT NULL,
  zona VARCHAR(100) DEFAULT NULL,
  estado ENUM('planificada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'planificada',
  usuario_id INT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rutas_estado (estado),
  INDEX idx_rutas_fecha (fecha),
  INDEX idx_rutas_conductor (conductor_id),
  INDEX idx_rutas_vehiculo (vehiculo_id),
  FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE SET NULL,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ruta_paradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruta_id INT NOT NULL,
  despacho_id INT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  estado_parada ENUM('pendiente','revisado','entregado','entrega_parcial','fallido') DEFAULT 'pendiente',
  hora_entrega DATETIME DEFAULT NULL,
  recibido_por VARCHAR(100) DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  motivo_fallo VARCHAR(255) DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ruta_paradas_ruta (ruta_id, orden),
  INDEX idx_ruta_paradas_despacho (despacho_id),
  FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
  FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
