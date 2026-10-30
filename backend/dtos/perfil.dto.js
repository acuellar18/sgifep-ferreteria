const { HttpError } = require('../utils/http-error');
const usuarioDto = require('./usuario.dto');

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarActualizar(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const apellido = typeof datos.apellido === 'string' ? datos.apellido.trim() : '';
  const correo = typeof datos.correo === 'string' ? datos.correo.trim() : '';

  if (!nombre) throw new HttpError(400, 'El nombre es requerido');
  if (nombre.length > 100) throw new HttpError(400, 'El nombre no puede superar los 100 caracteres');
  if (apellido.length > 100) throw new HttpError(400, 'El apellido no puede superar los 100 caracteres');
  if (correo && correo.length > 150) {
    throw new HttpError(400, 'El correo no puede superar los 150 caracteres');
  }
  if (correo && !CORREO_VALIDO.test(correo)) {
    throw new HttpError(400, 'El correo electrónico no es válido');
  }

  return {
    nombre,
    apellido: apellido || null,
    correo: correo || null
  };
}

function serializar(fila) {
  return usuarioDto.serializarPerfil(fila);
}

module.exports = { validarActualizar, serializar };
