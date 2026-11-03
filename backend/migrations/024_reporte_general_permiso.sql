-- 024_reporte_general_permiso.sql
-- Permiso granular para el Reporte General (dashboard central).

INSERT INTO permisos (clave, nombre, descripcion, modulo) VALUES
    ('reportes.general.ver', 'Ver Reporte General', 'Acceder al dashboard de indicadores generales del sistema.', 'reportes')
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    modulo = VALUES(modulo),
    activo = 1;

INSERT INTO permisos_rol (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.clave = 'reportes.general.ver'
WHERE r.nombre = 'administrador'
ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id);