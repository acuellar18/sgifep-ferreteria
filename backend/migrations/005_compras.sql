-- 005_compras.sql
-- Módulo de Compras: proveedores, compras, órdenes de compra, pagos
-- Idempotente: se puede ejecutar más de una vez sin errores.

-- ============================================
-- PROVEEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,              -- razón social / nombre comercial
    nit VARCHAR(20) DEFAULT NULL,              -- NIT Guatemala
    contacto_nombre VARCHAR(100) DEFAULT NULL, -- nombre de contacto
    telefono VARCHAR(30) DEFAULT NULL,
    correo VARCHAR(120) DEFAULT NULL,
    direccion VARCHAR(300) DEFAULT NULL,
    dias_credito INT NOT NULL DEFAULT 0,       -- días de crédito para vencimiento
    notas TEXT DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_nit ON proveedores(nit);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);

-- ============================================
-- ÓRDENES DE COMPRA (antes de compras por FK)
-- ============================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,        -- correlativo: OC-000045
    proveedor_id INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    fecha_esperada DATE DEFAULT NULL,
    estado ENUM('borrador','enviada','recibida_parcial','recibida','cancelada') NOT NULL DEFAULT 'borrador',
    notas TEXT DEFAULT NULL,
    subtotal_estimado DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva_estimado DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_estimado DECIMAL(14,2) NOT NULL DEFAULT 0,
    usuario_id INT NOT NULL,                   -- quien creó la orden
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ordenes_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ordenes_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes_compra(numero);
CREATE INDEX IF NOT EXISTS idx_ordenes_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_compra(fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_esperada ON ordenes_compra(fecha_esperada);

-- ============================================
-- COMPRAS
-- ============================================
CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,        -- correlativo: C-000123
    proveedor_id INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    numero_factura VARCHAR(50) DEFAULT NULL,   -- factura del proveedor
    condicion ENUM('contado','credito') NOT NULL DEFAULT 'contado',
    fecha_vencimiento DATE DEFAULT NULL,       -- calculada: fecha + dias_credito
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    iva DECIMAL(14,2) NOT NULL DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    monto_pagado DECIMAL(14,2) NOT NULL DEFAULT 0,
    saldo_pendiente DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado_pago ENUM('pendiente','parcial','pagada') NOT NULL DEFAULT 'pendiente',
    estado ENUM('recibida','anulada') NOT NULL DEFAULT 'recibida',
    orden_compra_id INT DEFAULT NULL,          -- referencia a orden de compra
    notas TEXT DEFAULT NULL,
    usuario_id INT NOT NULL,                   -- quien registró la compra
    adjunto_factura VARCHAR(255) DEFAULT NULL, -- ruta archivo factura (opcional)
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Datos de anulación
    anulada_en TIMESTAMP NULL DEFAULT NULL,
    anulada_por INT DEFAULT NULL,
    anulacion_motivo TEXT DEFAULT NULL,
    CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_compras_orden FOREIGN KEY (orden_compra_id)
        REFERENCES ordenes_compra(id) ON DELETE SET NULL,
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_compras_anulada_por FOREIGN KEY (anulada_por)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_compras_numero ON compras(numero);
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_factura ON compras(numero_factura, proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_estado_pago ON compras(estado_pago);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado);
CREATE INDEX IF NOT EXISTS idx_compras_vencimiento ON compras(fecha_vencimiento);

-- ============================================
-- DETALLE DE COMPRA
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(14,4) NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_detalle_compra_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_detalle_compra_compra ON detalle_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_detalle_compra_producto ON detalle_compra(producto_id);

-- ============================================
-- PAGOS A PROVEEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS pagos_proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    monto DECIMAL(14,2) NOT NULL,
    metodo ENUM('efectivo','transferencia','cheque','otro') NOT NULL DEFAULT 'efectivo',
    referencia VARCHAR(100) DEFAULT NULL,      -- n° cheque, n° transferencia, etc.
    notas VARCHAR(255) DEFAULT NULL,
    usuario_id INT NOT NULL,                   -- quien registró el pago
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_pagos_compra ON pagos_proveedor(compra_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos_proveedor(fecha);

-- ============================================
-- DETALLE DE ORDEN DE COMPRA
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_orden_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_solicitada DECIMAL(12,3) NOT NULL,
    cantidad_recibida DECIMAL(12,3) NOT NULL DEFAULT 0,
    costo_estimado DECIMAL(14,4) NOT NULL,
    CONSTRAINT fk_detalle_orden_orden FOREIGN KEY (orden_id)
        REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_orden_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_detalle_orden_orden ON detalle_orden_compra(orden_id);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_producto ON detalle_orden_compra(producto_id);

-- ============================================
-- RELACIÓN PRODUCTO-PROVEEDOR (proveedores habituales)
-- ============================================
CREATE TABLE IF NOT EXISTS producto_proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    proveedor_id INT NOT NULL,
    costo_ultimo DECIMAL(14,4) NOT NULL DEFAULT 0,
    es_preferido TINYINT(1) NOT NULL DEFAULT 0, -- proveedor principal para el producto
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pp_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE CASCADE,
    UNIQUE KEY uq_producto_proveedor (producto_id, proveedor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_pp_producto ON producto_proveedor(producto_id);
CREATE INDEX IF NOT EXISTS idx_pp_proveedor ON producto_proveedor(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pp_preferido ON producto_proveedor(es_preferido);