-- 027_despachos_rutas.sql
-- Esquema completo del módulo de Despacho: despachos, despacho_detalle,
-- despacho_historial, conductores, vehiculos, rutas y ruta_paradas.
--
-- Nota: los scripts sueltos database/scripts/024_despachos.sql y
-- 025_rutas_entregas.sql nunca formaron parte de backend/migrations, por lo
-- que las tablas no existían en la base de datos y el módulo fallaba con
-- "Error cargando despachos". Este archivo las crea de forma idempotente.
--
-- Ejecutar con: npm run migrate (en backend/).

-- ---------------------------------------------------------------------------
-- Despachos
-- codigo se guarda en dos pasos (se inserta con la venta y luego se actualiza
-- con el código tipo DSP-000001), por eso la columna es NULLABLE y UNIQUE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despachos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) DEFAULT NULL,
  venta_id BIGINT DEFAULT NULL,
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
  UNIQUE INDEX uq_despachos_codigo (codigo),
  INDEX idx_despachos_estado (estado),
  INDEX idx_despachos_fecha_programada (fecha_programada),
  INDEX idx_despachos_cliente (cliente_id),
  INDEX idx_despachos_venta (venta_id),
  CONSTRAINT fk_despachos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_despachos_venta FOREIGN KEY (venta_id) REFERENCES facturas(id) ON DELETE SET NULL,
  CONSTRAINT fk_despachos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detalle de despachos (productos a entregar)
CREATE TABLE IF NOT EXISTS despacho_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  despacho_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  entregado INT NOT NULL DEFAULT 0,
  INDEX idx_despacho_detalle_despacho (despacho_id),
  CONSTRAINT fk_despacho_detalle_despacho FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE,
  CONSTRAINT fk_despacho_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bitácora de cambios de estado de cada despacho
CREATE TABLE IF NOT EXISTS despacho_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  despacho_id INT NOT NULL,
  usuario_id INT DEFAULT NULL,
  de_estado VARCHAR(20) DEFAULT NULL,
  a_estado VARCHAR(20) NOT NULL,
  comentario TEXT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_despacho_historial_despacho (despacho_id, creado_en),
  CONSTRAINT fk_despacho_historial_despacho FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE,
  CONSTRAINT fk_despacho_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Catálogos de logística (conductores y vehículos)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Rutas de entrega
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rutas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) DEFAULT NULL,
  fecha DATE NOT NULL,
  conductor_id INT DEFAULT NULL,
  vehiculo_id INT DEFAULT NULL,
  zona VARCHAR(100) DEFAULT NULL,
  estado ENUM('planificada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'planificada',
  usuario_id INT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uq_rutas_codigo (codigo),
  INDEX idx_rutas_estado (estado),
  INDEX idx_rutas_fecha (fecha),
  INDEX idx_rutas_conductor (conductor_id),
  INDEX idx_rutas_vehiculo (vehiculo_id),
  CONSTRAINT fk_rutas_conductor FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE SET NULL,
  CONSTRAINT fk_rutas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL,
  CONSTRAINT fk_rutas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paradas (despachos asignados a una ruta)
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
  CONSTRAINT fk_ruta_paradas_ruta FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
  CONSTRAINT fk_ruta_paradas_despacho FOREIGN KEY (despacho_id) REFERENCES despachos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Datos semilla para poder probar: 2 conductores y 2 vehículos de ejemplo.
-- Idempotente: solo si el catálogo está vacío.
-- ---------------------------------------------------------------------------
INSERT INTO conductores (nombre, telefono, activo)
SELECT * FROM (
  SELECT 'Carlos Mendoza', '9998-1122', 1 UNION ALL
  SELECT 'Marta López',    '7777-3344', 1
) t
WHERE NOT EXISTS (SELECT 1 FROM conductores LIMIT 1);

INSERT INTO vehiculos (placa, descripcion, activo)
SELECT * FROM (
  SELECT 'P-2245-RT', 'Toyota Hilux — caja 10 pies', 1 UNION ALL
  SELECT 'P-8891-KM', 'Mitsubishi L200 — caja 12 pies', 1
) t
WHERE NOT EXISTS (SELECT 1 FROM vehiculos LIMIT 1);