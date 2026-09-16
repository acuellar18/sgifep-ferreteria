const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/auth');
const { HttpError } = require('../utils/http-error');

// Seguridad mediante JWT: valida el token Bearer enviado por el frontend y
// adjunta el usuario autenticado a req.usuario.
function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return next(new HttpError(401, 'Se requiere un token de acceso'));
  }

  try {
    const payload = jwt.verify(token, jwtConfig.secreto);
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

module.exports = { autenticar, requerirRoles };