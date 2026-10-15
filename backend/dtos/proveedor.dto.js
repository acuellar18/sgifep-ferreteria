const { HttpError } = require('../utils/http-error');

function validarNIT(nit) {
  if (!nit) return true;
  const limpio = nit.replace(/[-\s]/g, '').toUpperCase();
  if (!/^\d{1,11}-?[0-9K]$/.test(limpio)) return false;
  return true;
}

function baseValidacion(datos = {}) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'El nombre del proveedor es requerido');

  const nit = typeof datos.nit === 'string' ? datos.nit.trim().toUpperCase() : '';
  if (nit && !validarNIT(nit)) {
    throw new HttpError(400, 'El NIT no tiene un formato válido (ej: 12345678-9)');
  }

  const contacto_nombre = typeof datos.contacto_nombre === 'string' ? datos.contacto_nombre.trim() : '';
  const telefono = typeof datos.telefono === 'string' ? datos.telefono.trim() : '';
  const correo = typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : '';
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new HttpError(400, 'El correo no tiene un formato válido');
  }
  const direccion = typeof datos.direccion === 'string' ? datos.direccion.trim() : '';
  const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';

  let dias_credito = 0;
  if (datos.dias_credito !== undefined && datos.dias_credito !== null && datos.dias_credito !== '') {
    dias_credito = Number(datos.dias_credito);
    if (!Number.isInteger(dias_credito) || dias_credito < 0) {
      throw new HttpError(400, 'Los días de crédito deben ser un número entero no negativo');
    }
  }

  return {
    nombre,
    nit: nit || null,
    contacto_nombre: contacto_nombre || null,
    telefono: telefono || null,
    correo: correo || null,
    direccion: direccion || null,
    dias_credito,
    notas: notas || null,
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
    nombre: fila.nombre,
    nit: fila.nit,
    contacto_nombre: fila.contacto_nombre,
    telefono: fila.telefono,
    correo: fila.correo,
    direccion: fila.direccion,
    dias_credito: fila.dias_credito,
    notas: fila.notas,
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

function serializarResumen(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    nit: fila.nit,
    telefono: fila.telefono,
    saldo_pendiente: Number(fila.saldo_pendiente || 0),
    activo: Boolean(fila.activo)
  };
}

function serializarResumenLista(filas) {
  return filas.map(serializarResumen);
}

function serializarFicha(fila, compras = [], productos = []) {
  if (!fila) return null;
  return {
    ...serializar(fila),
    saldo_pendiente: Number(fila.saldo_pendiente || 0),
    total_compras: Number(fila.total_compras || 0),
    compras: compras.map(c => ({
      id: c.id,
      numero: c.numero,
      fecha: c.fecha,
      total: Number(c.total),
      estado_pago: c.estado_pago,
      estado: c.estado
    })),
    productos: productos.map(p => ({
      id: p.producto_id,
      codigo: p.codigo,
      nombre: p.nombre,
      costo_ultimo: Number(p.costo_ultimo),
      es_preferido: Boolean(p.es_preferido)
    }))
  };
}

module.exports = {
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista,
  serializarResumen,
  serializarResumenLista,
  serializarFicha,
  validarNIT
};