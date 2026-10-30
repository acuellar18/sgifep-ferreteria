-- 018_pos_ventas.sql
-- Punto de venta (POS): ventas de mostrador, su detalle y cobros.
-- Idempotente para MariaDB 10.4+ y MySQL 8.

CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    caja_id BIGINT NOT NULL,
    factura_id BIGINT DEFAULT NULL,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
    monto_recibido DECIMAL(14,2) NOT NULL DEFAULT 0,
    cambio DECIMAL(14,2) NOT NULL DEFAULT 0,
    referencia VARCHAR(100) DEFAULT NULL,
    estado ENUM('completada', 'anulada') NOT NULL DEFAULT 'completada',
    anulada_en TIMESTAMP NULL DEFAULT NULL,
    anulada_por INT DEFAULT NULL,
    anulacion_motivo VARCHAR(255) DEFAULT NULL,
    observaciones VARCHAR(255) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ventas_caja FOREIGN KEY (caja_id)
        REFERENCES sesiones_caja(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_factura FOREIGN KEY (factura_id)
        REFERENCES facturas(id) ON DELETE SET NULL,
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_anulada_por FOREIGN KEY (anulada_por)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY uq_ventas_factura (factura_id),
    INDEX idx_ventas_caja_estado (caja_id, estado),
    INDEX idx_ventas_creado (creado_en),
    INDEX idx_ventas_cliente (cliente_id),
    INDEX idx_ventas_metodo (metodo_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_venta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    producto_id INT NOT NULL,
    producto_codigo VARCHAR(30) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    presentacion VARCHAR(100) DEFAULT NULL,
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'UNI',
    tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(14,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(14,2) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_venta_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_venta_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_venta_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_venta_descuento CHECK (descuento >= 0),
    INDEX idx_detalle_venta_venta (venta_id),
    INDEX idx_detalle_venta_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cobros (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    venta_id BIGINT DEFAULT NULL,
    factura_id BIGINT DEFAULT NULL,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
    monto DECIMAL(14,2) NOT NULL,
    referencia VARCHAR(100) DEFAULT NULL,
    estado ENUM('registrado', 'anulado') NOT NULL DEFAULT 'registrado',
    anulada_en TIMESTAMP NULL DEFAULT NULL,
    anulacion_motivo VARCHAR(255) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cobros_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE SET NULL,
    CONSTRAINT fk_cobros_factura FOREIGN KEY (factura_id)
        REFERENCES facturas(id) ON DELETE SET NULL,
    CONSTRAINT fk_cobros_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cobros_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT chk_cobros_monto CHECK (monto > 0),
    INDEX idx_cobros_venta (venta_id),
    INDEX idx_cobros_factura (factura_id),
    INDEX idx_cobros_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reversos:
-- DROP TABLE IF EXISTS cobros;
-- DROP TABLE IF EXISTS detalle_venta;
-- DROP TABLE IF EXISTS ventas;
