const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwt: jwtConfig } = require('../config/auth');
const { HttpError } = require('../utils/http-error');

// Seguridad mediante JWT: valida el token Bearer enviado por el frontend y
// adjunta el usuario autenticado a req.usuario.
// Además verifica sesiones_version: cuando el usuario cambia su contraseña la
// versión se incrementa y todos los tokens previos quedan inválidos al instante.
async function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return next(new HttpError(401, 'Se requiere un token de acceso'));
  }

  try {
    const payload = jwt.verify(token, jwtConfig.secreto);
    const [rows] = await pool.query(
      'SELECT sesiones_version FROM usuarios WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    if (!rows.length) {
      return next(new HttpError(401, 'Sesión inválida. Inicia sesión nuevamente.'));
    }
    const versionActual = Number(rows[0].sesiones_version) || 1;
    // Tokens sin `ver` (previos al cambio de contraseña) solo valen para
    // usuarios en versión 1; tras cualquier cambio quedan invalidados.
    const versionToken = payload.ver === undefined ? 1 : Number(payload.ver);
    if (versionToken !== versionActual) {
      return next(new HttpError(401, 'Sesión inválida. Inicia sesión nuevamente.'));
    }
    req.usuario = {
      id: payload.sub,
      username: payload.username,
      nombre: payload.nombre,
      roles: payload.roles || [],
      superadmin: Boolean(payload.superadmin)
    };
    return next();
  } catch {
    return next(new HttpError(401, 'Token inválido o expirado'));
  }
}

// Restricción por roles: permite acceso si el usuario tiene alguno de los
// roles indicados, o si es superadmin (acceso total) por defecto.
function requerirRoles(rolesPermitidos = [], opciones = {}) {
  const { permitirSuperadmin = true } = opciones;
  return (req, _res, next) => {
    const usuario = req.usuario;
    if (!usuario) {
      return next(new HttpError(401, 'Se requiere un token de acceso'));
    }
    const tieneRol = usuario.roles.some((rol) => rolesPermitidos.includes(rol));
    if (tieneRol || (usuario.superadmin && permitirSuperadmin)) {
      return next();
    }
    return next(new HttpError(403, 'No tiene permisos para realizar esta acción'));
  };
}

// Carga en req.permisos las claves activas del usuario según sus roles.
// Debe ejecutarse después de autenticar. Los superadmins reciben todas.
async function cargarPermisos(req, _res, next) {
  try {
    if (!req.usuario) {
      return next(new HttpError(401, 'Se requiere un token de acceso'));
    }

    let filas = [];
    if (req.usuario.superadmin) {
      [filas] = await pool.query('SELECT clave FROM permisos WHERE activo = 1');
    } else {
      const roles = Array.isArray(req.usuario.roles) ? req.usuario.roles : [];
      if (roles.length) {
        const marcadores = roles.map(() => '?').join(', ');
        [filas] = await pool.query(
          `SELECT DISTINCT p.clave
           FROM permisos p
           JOIN permisos_rol pr ON pr.permiso_id = p.id
           JOIN roles r ON r.id = pr.rol_id
           WHERE p.activo = 1 AND r.activo = 1 AND r.nombre IN (${marcadores})`,
          roles
        );
      }
    }

    req.permisos = new Set(filas.map((fila) => fila.clave));
    return next();
  } catch (error) {
    return next(error);
  }
}

// Restricción por permiso granular cargado desde la base de datos.
function requerirPermiso(clave) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(new HttpError(401, 'Se requiere un token de acceso'));
    }
    if (req.permisos?.has(clave)) {
      return next();
    }
    return next(new HttpError(403, 'No tiene permisos para realizar esta acción'));
  };
}

module.exports = { autenticar, requerirRoles, cargarPermisos, requerirPermiso };