-- 004_productos.sql
-- Módulo de Compras: tabla de productos/inventario (base para compras y stock)
-- Idempotente: se puede ejecutar más de una vez sin errores.

-- Tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500) DEFAULT NULL,
    categoria_id INT DEFAULT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNI', -- UNI, MTS, KG, LT, GL, CJA, PAQ, ROL
    stock_actual DECIMAL(12,3) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
    costo_ultimo DECIMAL(12,4) NOT NULL DEFAULT 0, -- 4 decimales para precisión
    costo_promedio DECIMAL(12,4) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo ON productos(stock_actual, stock_minimo);

-- Semillas de categorías básicas de ferretería
INSERT INTO categorias (id, nombre, descripcion, activo) VALUES
    (1, 'Cemento y Concreto', 'Cemento, concreto, mortero y aditivos', 1),
    (2, 'Tubería y Conexiones', 'Tuberías PVC, cobre, galvanizado y sus conexiones', 1),
    (3, 'Pinturas y Recubrimientos', 'Pinturas, esmaltes, selladores, impermeabilizantes', 1),
    (4, 'Herramientas Manuales', 'Martillos, llaves, alicates, destornilladores, sierras', 1),
    (5, 'Herramientas Eléctricas', 'Taladros, sierras eléctricas, amoladoras, pulidoras', 1),
    (6, 'Material Eléctrico', 'Cables, interruptores, tomacorrientes, breakers, tableros', 1),
    (7, 'Cerrajería y Seguridad', 'Cerraduras, candados, bisagras, pestillos, alarmas', 1),
    (8, 'Tornillería y Fijación', 'Tornillos, clavos, tarugos, anclajes, pernos', 1),
    (9, 'Plomería y Sanitarios', 'Llaves de paso, válvulas, sanitarios, grifería', 1),
    (10, 'Ferretería General', 'Productos varios de ferretería', 1)
ON DUPLICATE KEY UPDATE id = id;