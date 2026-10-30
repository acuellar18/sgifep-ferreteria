-- 014_facturacion_clientes.sql
-- Fase 1 de Facturación: catálogo de clientes y permisos del módulo.
-- Idempotente para MariaDB 10.4+.

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) DEFAULT NULL,
    correo VARCHAR(150) DEFAULT NULL,
    direccion VARCHAR(255) DEFAULT NULL,
    dias_credito INT NOT NULL DEFAULT 0,
    limite_credito DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_clientes_nombre (nombre),
    INDEX idx_clientes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO clientes (nit, nombre, telefono, correo, direccion, dias_credito, limite_credito, estado)
VALUES ('CF', 'Consumidor Final', NULL, NULL, NULL, 0, 0, 'activo')
ON DUPLICATE KEY UPDATE nit = VALUES(nit);

INSERT INTO permisos (clave, nombre, descripcion, modulo) VALUES
    ('facturacion.clientes.ver', 'Ver clientes', 'Consultar el catálogo y el saldo de los clientes.', 'facturacion'),
    ('facturacion.clientes.crear', 'Crear clientes', 'Registrar clientes para facturación.', 'facturacion'),
    ('facturacion.clientes.editar', 'Editar clientes', 'Modificar datos y estado de los clientes.', 'facturacion'),
    ('facturacion.facturas.ver', 'Ver facturas', 'Consultar facturas emitidas y sus detalles.', 'facturacion'),
    ('facturacion.facturas.crear', 'Crear facturas', 'Emitir facturas y descontar inventario.', 'facturacion'),
    ('facturacion.facturas.anular', 'Anular facturas', 'Anular facturas y devolver el inventario.', 'facturacion'),
    ('facturacion.cobros.ver', 'Ver cobros', 'Consultar cuentas por cobrar e historial de cobros.', 'facturacion'),
    ('facturacion.cobros.registrar', 'Registrar cobros', 'Aplicar pagos a las facturas.', 'facturacion'),
    ('facturacion.cobros.anular', 'Anular cobros', 'Anular cobros aplicados a facturas.', 'facturacion'),
    ('facturacion.reporte.ver', 'Ver reporte de facturación', 'Consultar indicadores y reportes de facturación.', 'facturacion'),
    ('facturacion.reporte.exportar', 'Exportar reporte de facturación', 'Descargar el reporte de facturación en CSV o PDF.', 'facturacion')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    modulo = VALUES(modulo),
    activo = 1;

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.modulo = 'facturacion'
WHERE r.nombre = 'administrador'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave IN (
    'facturacion.clientes.ver',
    'facturacion.clientes.crear',
    'facturacion.clientes.editar',
    'facturacion.facturas.ver',
    'facturacion.facturas.crear',
    'facturacion.cobros.ver',
    'facturacion.reporte.ver',
    'facturacion.reporte.exportar'
)
WHERE r.nombre = 'ventas'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave IN (
    'facturacion.clientes.ver',
    'facturacion.clientes.crear',
    'facturacion.clientes.editar',
    'facturacion.facturas.ver',
    'facturacion.cobros.ver',
    'facturacion.cobros.registrar',
    'facturacion.reporte.ver',
    'facturacion.reporte.exportar'
)
WHERE r.nombre = 'caja'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Reversos
-- DELETE FROM permisos_rol WHERE permiso_id IN (SELECT id FROM permisos WHERE modulo = 'facturacion');
-- DELETE FROM permisos WHERE modulo = 'facturacion';
-- DROP TABLE IF EXISTS clientes;
