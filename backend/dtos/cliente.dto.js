const { HttpError } = require('../utils/http-error');

const ESTADOS = ['activo', 'inactivo'];
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function enteroNoNegativo(valor, nombreCampo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    throw new HttpError(400, `${nombreCampo} debe ser un número entero mayor o igual a 0`);
  }
  return numero;
}

function montoNoNegativo(valor, nombreCampo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new HttpError(400, `${nombreCampo} debe ser un número mayor o igual a 0`);
  }
  return Math.round(numero * 100) / 100;
}

function baseValidacion(datos = {}, base = {}) {
  const nit = texto(datos.nit !== undefined ? datos.nit : base.nit).toUpperCase();
  if (!nit) throw new HttpError(400, 'El NIT del cliente es requerido');
  if (nit.length > 20) throw new HttpError(400, 'El NIT no puede superar los 20 caracteres');

  const nombre = texto(datos.nombre !== undefined ? datos.nombre : base.nombre);
  if (!nombre) throw new HttpError(400, 'El nombre del cliente es requerido');
  if (nombre.length > 150) throw new HttpError(400, 'El nombre no puede superar los 150 caracteres');

  const telefono = texto(datos.telefono !== undefined ? datos.telefono : base.telefono);
  if (telefono.length > 30) throw new HttpError(400, 'El teléfono no puede superar los 30 caracteres');

  const correo = texto(datos.correo !== undefined ? datos.correo : base.correo).toLowerCase();
  if (correo.length > 150) throw new HttpError(400, 'El correo no puede superar los 150 caracteres');
  if (correo && !CORREO_VALIDO.test(correo)) {
    throw new HttpError(400, 'El correo electrónico no es válido');
  }

  const direccion = texto(datos.direccion !== undefined ? datos.direccion : base.direccion);
  if (direccion.length > 255) {
    throw new HttpError(400, 'La dirección no puede superar los 255 caracteres');
  }

  const diasCredito = enteroNoNegativo(
    datos.dias_credito !== undefined ? datos.dias_credito : base.dias_credito ?? 0,
    'Los días de crédito'
  );
  if (diasCredito > 3650) {
    throw new HttpError(400, 'Los días de crédito no pueden superar 3650');
  }

  const limiteCredito = montoNoNegativo(
    datos.limite_credito !== undefined ? datos.limite_credito : base.limite_credito ?? 0,
    'El límite de crédito'
  );

  const estado = texto(datos.estado !== undefined ? datos.estado : base.estado || 'activo').toLowerCase();
  if (!ESTADOS.includes(estado)) {
    throw new HttpError(400, 'El estado del cliente debe ser activo o inactivo');
  }

  return {
    nit,
    nombre,
    telefono: telefono || null,
    correo: correo || null,
    direccion: direccion || null,
    dias_credito: diasCredito,
    limite_credito: limiteCredito,
    estado
  };
}

function validarCrear(datos = {}) {
  return baseValidacion(datos);
}

function validarActualizar(datos = {}, actual = {}) {
  return baseValidacion(datos, actual);
}

function serializar(fila) {
  if (!fila) return null;
  const estado = fila.estado || 'activo';
  return {
    id: Number(fila.id),
    nit: fila.nit,
    nombre: fila.nombre,
    telefono: fila.telefono || null,
    correo: fila.correo || null,
    direccion: fila.direccion || null,
    dias_credito: Number(fila.dias_credito || 0),
    limite_credito: Number(fila.limite_credito || 0),
    estado,
    activo: estado === 'activo',
    es_predeterminado: String(fila.nit || '').toUpperCase() === 'CF',
    saldo_actual: Number(fila.saldo_actual || 0),
    facturas_pendientes: Number(fila.facturas_pendientes || 0),
    created_at: fila.created_at
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = {
  ESTADOS,
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista
};
