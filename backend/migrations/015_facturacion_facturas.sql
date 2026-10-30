-- 015_facturacion_facturas.sql
-- Fase 2 de Facturación: facturas de venta y su detalle.
-- Idempotente para MariaDB 10.4+.

-- ============================================
-- 1. Orígenes de inventario para ventas
-- ============================================
ALTER TABLE movimientos_inventario
    MODIFY COLUMN origen ENUM(
        'compra',
        'anulacion_compra',
        'ajuste_manual',
        'ajuste_positivo',
        'ajuste_negativo',
        'inventario_inicial',
        'venta',
        'anulacion_venta',
        'otro'
    ) NOT NULL DEFAULT 'otro';

-- ============================================
-- 2. Facturas
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_nit VARCHAR(20) NOT NULL,
    cliente_telefono VARCHAR(30) DEFAULT NULL,
    cliente_correo VARCHAR(150) DEFAULT NULL,
    cliente_direccion VARCHAR(255) DEFAULT NULL,
    fecha DATE NOT NULL,
    condicion ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
    fecha_vencimiento DATE DEFAULT NULL,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    monto_pagado DECIMAL(14,2) NOT NULL DEFAULT 0,
    saldo_pendiente DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado ENUM('emitida', 'anulada') NOT NULL DEFAULT 'emitida',
    estado_pago ENUM('pendiente', 'parcial', 'pagada') NOT NULL DEFAULT 'pendiente',
    notas VARCHAR(500) DEFAULT NULL,
    usuario_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    anulada_en TIMESTAMP NULL DEFAULT NULL,
    anulada_por INT DEFAULT NULL,
    anulacion_motivo VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_facturas_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_facturas_anulada_por FOREIGN KEY (anulada_por)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_facturas_cliente_fecha ON facturas(cliente_id, fecha);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_estado_pago ON facturas(estado_pago);

-- ============================================
-- 3. Detalle de factura
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_factura (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    producto_id INT NOT NULL,
    producto_codigo VARCHAR(30) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'UNI',
    tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,4) NOT NULL DEFAULT 0,
    subtotal DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_detalle_factura_factura FOREIGN KEY (factura_id)
        REFERENCES facturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_factura_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_factura_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_factura_precio CHECK (precio_unitario >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_detalle_factura_factura ON detalle_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_detalle_factura_producto ON detalle_factura(producto_id);

-- Reversos
-- DROP TABLE IF EXISTS detalle_factura;
-- DROP TABLE IF EXISTS facturas;
-- ALTER TABLE movimientos_inventario
--     MODIFY COLUMN origen ENUM(
--         'compra','anulacion_compra','ajuste_manual','ajuste_positivo',
--         'ajuste_negativo','inventario_inicial','otro'
--     ) NOT NULL DEFAULT 'otro';
