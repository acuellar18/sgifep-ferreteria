const { HttpError } = require('../utils/http-error');

function limpiar(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validar(datos = {}) {
  const nombre = limpiar(datos.nombre);
  if (!nombre) throw new HttpError(400, 'El nombre de la empresa es requerido');
  if (nombre.length > 150) throw new HttpError(400, 'El nombre no puede exceder 150 caracteres');

  const nit = limpiar(datos.nit).toUpperCase();
  if (nit.length > 20) throw new HttpError(400, 'El NIT no puede exceder 20 caracteres');

  const direccion = limpiar(datos.direccion);
  if (direccion.length > 300) throw new HttpError(400, 'La dirección no puede exceder 300 caracteres');

  const telefono = limpiar(datos.telefono);
  if (telefono.length > 40) throw new HttpError(400, 'El teléfono no puede exceder 40 caracteres');

  const correo = limpiar(datos.correo).toLowerCase();
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new HttpError(400, 'El correo no tiene un formato válido');
  }

  const logo_url = limpiar(datos.logo_url);
  if (logo_url.length > 300) throw new HttpError(400, 'La ruta del logo no puede exceder 300 caracteres');

  return {
    nombre,
    nit: nit || null,
    direccion: direccion || null,
    telefono: telefono || null,
    correo: correo || null,
    logo_url: logo_url || null
  };
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    nit: fila.nit,
    direccion: fila.direccion,
    telefono: fila.telefono,
    correo: fila.correo,
    logo_url: fila.logo_url,
    actualizado_en: fila.actualizado_en
  };
}

module.exports = { validar, serializar };
