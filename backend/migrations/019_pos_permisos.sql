-- 019_pos_permisos.sql
-- Habilita el registro de ventas de mostrador a los roles operativos del POS.
-- Idempotente.

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave = 'facturacion.cobros.registrar'
WHERE r.nombre IN ('administrador', 'caja', 'ventas')
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);

-- Reverso:
-- DELETE pr FROM permisos_rol pr
-- JOIN roles r ON r.id = pr.rol_id
-- JOIN permisos p ON p.id = pr.permiso_id
-- WHERE r.nombre = 'ventas' AND p.clave = 'facturacion.cobros.registrar';
