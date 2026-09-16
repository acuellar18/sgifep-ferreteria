const { HttpError } = require('../utils/http-error');

// DTOs de DEPARTAMENTO: validación de entrada y serialización de salida.

function validar(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) {
    throw new HttpError(400, 'El nombre es requerido');
  }
  return {
    nombre,
    descripcion: typeof datos.descripcion === 'string' && datos.descripcion.trim()
      ? datos.descripcion.trim()
      : null,
    activo: datos.activo === undefined ? true : Boolean(datos.activo)
  };
}

function validarEstado(activo) {
  const valor = Number(activo);
  if (valor !== 0 && valor !== 1) {
    throw new HttpError(400, 'El campo activo debe ser 0 o 1');
  }
  return valor;
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    numero_usuarios: fila.numero_usuarios === undefined ? undefined : Number(fila.numero_usuarios)
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = { validar, validarEstado, serializar, serializarLista };