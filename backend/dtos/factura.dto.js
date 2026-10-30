const { HttpError } = require('../utils/http-error');

const IVA_PORCENTAJE = 12;
const IVA_FACTOR = 0.12;
const ESTADOS = ['emitida', 'anulada'];
const ESTADOS_PAGO = ['pendiente', 'parcial', 'pagada'];

function redondear2(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function redondear4(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 10000) / 10000;
}

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    date.getUTCFullYear() === anio &&
    date.getUTCMonth() === mes - 1 &&
    date.getUTCDate() === dia
  );
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarCrear(datos = {}) {
  const clienteId = Number(datos.cliente_id);
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new HttpError(400, 'Falta seleccionar un cliente');
  }

  const fecha = texto(datos.fecha);
  if (!fecha || !fechaValida(fecha)) {
    throw new HttpError(400, 'La fecha es requerida y debe tener formato YYYY-MM-DD');
  }

  const condicion = texto(datos.condicion).toLowerCase() === 'credito' ? 'credito' : 'contado';

  let fechaVencimiento = null;
  if (condicion === 'credito') {
    fechaVencimiento = texto(datos.fecha_vencimiento) || null;
    if (fechaVencimiento && !fechaValida(fechaVencimiento)) {
      throw new HttpError(400, 'La fecha de vencimiento debe tener formato YYYY-MM-DD');
    }
    if (fechaVencimiento && fechaVencimiento < fecha) {
      throw new HttpError(400, 'La fecha de vencimiento no puede ser anterior a la fecha de la factura');
    }
  }

  const notas = texto(datos.notas);
  if (notas.length > 500) {
    throw new HttpError(400, 'Las notas no pueden superar los 500 caracteres');
  }

  const detalles = Array.isArray(datos.detalles) ? datos.detalles : [];
  if (detalles.length === 0) {
    throw new HttpError(400, 'Debe agregar al menos un producto o servicio a la factura');
  }

  const vistos = new Set();
  const detallesNormalizados = detalles.map((detalle, indice) => {
    const productoId = Number(detalle.producto_id);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: Falta seleccionar un producto`);
    }
    if (vistos.has(productoId)) {
      throw new HttpError(400, `Línea ${indice + 1}: El producto está repetido en la factura`);
    }
    vistos.add(productoId);

    const cantidad = Number(detalle.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: La cantidad debe ser mayor a 0`);
    }
    if (cantidad > 999999999.999) {
      throw new HttpError(400, `Línea ${indice + 1}: La cantidad excede el máximo permitido`);
    }

    if (detalle.precio_unitario === '' || detalle.precio_unitario == null) {
      throw new HttpError(400, `Línea ${indice + 1}: El precio unitario es requerido`);
    }
    const precioUnitario = Number(detalle.precio_unitario);
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new HttpError(400, `Línea ${indice + 1}: El precio unitario no puede ser negativo`);
    }
    if (precioUnitario > 9999999999.99) {
      throw new HttpError(400, `Línea ${indice + 1}: El precio unitario excede el máximo permitido`);
    }

    return {
      producto_id: productoId,
      cantidad,
      precio_unitario: redondear2(precioUnitario)
    };
  });

  return {
    cliente_id: clienteId,
    fecha,
    condicion,
    fecha_vencimiento: fechaVencimiento,
    notas: notas || null,
    detalles: detallesNormalizados
  };
}

function validarAnulacion(datos = {}) {
  const motivo = texto(datos.motivo);
  if (!motivo) throw new HttpError(400, 'El motivo de anulación es requerido');
  if (motivo.length > 255) {
    throw new HttpError(400, 'El motivo de anulación no puede superar los 255 caracteres');
  }
  return { motivo };
}

function calcularTotales(detalles) {
  let subtotal = 0;
  const lineas = detalles.map((detalle) => {
    const lineaSubtotal = redondear2(Number(detalle.cantidad) * Number(detalle.precio_unitario));
    subtotal = redondear2(subtotal + lineaSubtotal);
    return { ...detalle, subtotal: lineaSubtotal };
  });
  const iva = redondear2(subtotal * IVA_FACTOR);
  const total = redondear2(subtotal + iva);
  return { subtotal, iva, total, detalles: lineas };
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    numero: fila.numero,
    cliente_id: Number(fila.cliente_id),
    cliente_nombre: fila.cliente_nombre,
    cliente_nit: fila.cliente_nit,
    cliente_telefono: fila.cliente_telefono || null,
    cliente_correo: fila.cliente_correo || null,
    cliente_direccion: fila.cliente_direccion || null,
    fecha: fila.fecha,
    condicion: fila.condicion,
    fecha_vencimiento: fila.fecha_vencimiento || null,
    subtotal: Number(fila.subtotal || 0),
    iva: Number(fila.iva || 0),
    total: Number(fila.total || 0),
    monto_pagado: Number(fila.monto_pagado || 0),
    saldo_pendiente: Number(fila.saldo_pendiente || 0),
    estado: fila.estado,
    estado_pago: fila.estado_pago,
    notas: fila.notas || null,
    usuario_id: fila.usuario_id ? Number(fila.usuario_id) : null,
    usuario_nombre: fila.usuario_nombre || null,
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    anulada_en: fila.anulada_en || null,
    anulada_por: fila.anulada_por ? Number(fila.anulada_por) : null,
    anulada_por_nombre: fila.anulada_por_nombre || null,
    anulacion_motivo: fila.anulacion_motivo || null
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

function serializarProductoVenta(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    codigo: fila.codigo,
    codigo_barras: fila.codigo_barras || null,
    nombre: fila.nombre,
    tipo: fila.tipo,
    unidad_medida: fila.unidad_medida,
    stock_actual: Number(fila.stock_actual || 0),
    precio_venta: Number(fila.precio_venta || 0)
  };
}

function serializarDetalle(fila, detalles = []) {
  if (!fila) return null;
  const base = serializar(fila);
  return {
    ...base,
    cliente: {
      id: base.cliente_id,
      nombre: base.cliente_nombre,
      nit: base.cliente_nit,
      telefono: base.cliente_telefono,
      correo: base.cliente_correo,
      direccion: base.cliente_direccion
    },
    detalles: detalles.map((d) => ({
      id: Number(d.id),
      producto_id: Number(d.producto_id),
      producto_codigo: d.producto_codigo,
      producto_nombre: d.producto_nombre,
      unidad_medida: d.unidad_medida,
      tipo: d.tipo,
      cantidad: Number(d.cantidad || 0),
      precio_unitario: Number(d.precio_unitario || 0),
      subtotal: Number(d.subtotal || 0)
    }))
  };
}

module.exports = {
  IVA_PORCENTAJE,
  IVA_FACTOR,
  ESTADOS,
  ESTADOS_PAGO,
  redondear2,
  redondear4,
  fechaValida,
  validarCrear,
  validarAnulacion,
  calcularTotales,
  serializar,
  serializarLista,
  serializarProductoVenta,
  serializarDetalle
};
