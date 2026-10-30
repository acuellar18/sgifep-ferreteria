-- 010_inventario_permisos.sql
-- Fase 2 de Inventario: permisos granulares por rol.
-- La autorización se consulta en base de datos; no se hardcodean roles en las
-- rutas de Inventario.

CREATE TABLE IF NOT EXISTS permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(80) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    modulo VARCHAR(40) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permisos_rol (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_permisos_rol_rol FOREIGN KEY (rol_id)
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_permisos_rol_permiso FOREIGN KEY (permiso_id)
        REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO permisos (clave, nombre, descripcion, modulo) VALUES
    ('inventario.productos.ver', 'Ver productos', 'Consultar el catálogo y existencias de productos.', 'inventario'),
    ('inventario.productos.ver_costos', 'Ver costos de productos', 'Consultar costo último, costo promedio y valor del inventario.', 'inventario'),
    ('inventario.productos.crear', 'Crear productos', 'Registrar productos nuevos.', 'inventario'),
    ('inventario.productos.editar', 'Editar productos', 'Modificar datos de productos sin alterar existencias.', 'inventario'),
    ('inventario.productos.eliminar', 'Eliminar productos', 'Eliminar productos sin compras, órdenes ni movimientos distintos al inventario inicial.', 'inventario'),
    ('inventario.categorias.ver', 'Ver categorías', 'Consultar las categorías de inventario.', 'inventario'),
    ('inventario.categorias.crear', 'Crear categorías', 'Registrar categorías de inventario.', 'inventario'),
    ('inventario.categorias.editar', 'Editar categorías', 'Modificar categorías de inventario.', 'inventario'),
    ('inventario.categorias.eliminar', 'Eliminar categorías', 'Eliminar categorías sin productos asociados.', 'inventario'),
    ('inventario.movimientos.ver', 'Ver movimientos', 'Consultar el historial de entradas y salidas.', 'inventario'),
    ('inventario.movimientos.ajustar', 'Ajustar inventario', 'Registrar ajustes positivos o negativos con motivo.', 'inventario'),
    ('inventario.reporte.ver', 'Ver reporte de inventario', 'Consultar el reporte valorizado y sus indicadores.', 'inventario'),
    ('inventario.reporte.exportar', 'Exportar reporte de inventario', 'Descargar el reporte en CSV, Excel o PDF.', 'inventario')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    modulo = VALUES(modulo),
    activo = 1;

-- Administrador: todos los permisos de Inventario.
INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.modulo = 'inventario'
WHERE r.nombre = 'administrador'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Compras: catálogo, costos y reporte; sin ajustes ni eliminación.
INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave IN (
    'inventario.productos.ver',
    'inventario.productos.ver_costos',
    'inventario.productos.crear',
    'inventario.productos.editar',
    'inventario.categorias.ver',
    'inventario.movimientos.ver',
    'inventario.reporte.ver',
    'inventario.reporte.exportar'
)
WHERE r.nombre = 'compras'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Bodega: igual que Compras más el ajuste de existencias.
INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave IN (
    'inventario.productos.ver',
    'inventario.productos.ver_costos',
    'inventario.productos.crear',
    'inventario.productos.editar',
    'inventario.categorias.ver',
    'inventario.movimientos.ver',
    'inventario.movimientos.ajustar',
    'inventario.reporte.ver',
    'inventario.reporte.exportar'
)
WHERE r.nombre = 'bodega'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Caja, ventas y reparto: solo consulta de productos, sin costos.
INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave = 'inventario.productos.ver'
WHERE r.nombre IN ('caja', 'ventas', 'reparto')
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Reversos
-- DROP TABLE IF EXISTS permisos_rol;
-- DROP TABLE IF EXISTS permisos;
