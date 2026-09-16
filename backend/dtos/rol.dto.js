const { HttpError } = require('../utils/http-error');

// DTOs de ROL: validación de entrada y serialización de salida. La capa de
// transporte (rutas/controladores) nunca recibe ni devuelve SQL crudo.

function validar(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) {
    throw new HttpError(400, 'El nombre es requerido');
  }

  // superadmin y acceso_total son sinónimos: se mantienen sincronizados.
  const superadmin = Boolean(datos.superadmin ?? datos.acceso_total);
  return {
    nombre,
    descripcion: typeof datos.descripcion === 'string' && datos.descripcion.trim()
      ? datos.descripcion.trim()
      : null,
    superadmin,
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
    superadmin: Boolean(fila.superadmin ?? fila.acceso_total),
    acceso_total: Boolean(fila.acceso_total ?? fila.superadmin),
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    numero_usuarios: fila.numero_usuarios === undefined ? undefined : Number(fila.numero_usuarios)
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = { validar, validarEstado, serializar, serializarLista };