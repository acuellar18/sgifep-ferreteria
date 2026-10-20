const { HttpError } = require('../utils/http-error');

function baseValidacion(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'El nombre de la categoría es requerido');
  if (nombre.length > 100) throw new HttpError(400, 'El nombre no puede superar los 100 caracteres');

  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
  if (descripcion.length > 255) {
    throw new HttpError(400, 'La descripción no puede superar los 255 caracteres');
  }

  return {
    nombre,
    descripcion: descripcion || null,
    activo: datos.activo === undefined ? true : Boolean(datos.activo)
  };
}

function validarCrear(datos = {}) {
  return baseValidacion(datos);
}

function validarActualizar(datos = {}) {
  return baseValidacion(datos);
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    codigo: `CAT-${String(fila.id).padStart(3, '0')}`,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    productos: Number(fila.productos || 0),
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = {
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista
};
