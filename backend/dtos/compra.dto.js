const { HttpError } = require('../utils/http-error');

// IVA 12% configurable en un solo lugar
const IVA_PORCENTAJE = 12;
const IVA_FACTOR = 0.12;

function redondear2(valor) {
  return Math.round(valor * 100) / 100;
}

function baseValidacion(datos = {}) {
  const proveedor_id = Number(datos.proveedor_id);
  if (!proveedor_id || !Number.isInteger(proveedor_id)) {
    throw new HttpError(400, 'Falta seleccionar un proveedor');
  }

  const fecha = datos.fecha ? String(datos.fecha).trim() : '';
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new HttpError(400, 'La fecha es requerida y debe tener formato YYYY-MM-DD');
  }

  const numero_factura = typeof datos.numero_factura === 'string' ? datos.numero_factura.trim().toUpperCase() : '';
  const serie = typeof datos.serie === 'string' ? datos.serie.trim().toUpperCase() : '';
  const condicion = datos.condicion === 'credito' ? 'credito' : 'contado';

  let fecha_vencimiento = null;
  if (condicion === 'credito') {
    fecha_vencimiento = datos.fecha_vencimiento ? String(datos.fecha_vencimiento).trim() : '';
    if (!fecha_vencimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
      throw new HttpError(400, 'En compras a crédito, la fecha de vencimiento es requerida');
    }
  }

  const orden_compra_id = datos.orden_compra_id ? Number(datos.orden_compra_id) : null;
  const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';
  const adjunto_factura = typeof datos.adjunto_factura === 'string' ? datos.adjunto_factura.trim() : '';

  const detalles = Array.isArray(datos.detalles) ? datos.detalles : [];
  if (detalles.length === 0) {
    throw new HttpError(400, 'Debe agregar al menos un producto a la compra');
  }

  for (let i = 0; i < detalles.length; i++) {
    const d = detalles[i];
    const producto_id = Number(d.producto_id);
    if (!producto_id || !Number.isInteger(producto_id)) {
      throw new HttpError(400, `Línea ${i + 1}: Falta seleccionar un producto`);
    }
    const cantidad = Number(d.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new HttpError(400, `Línea ${i + 1}: La cantidad debe ser mayor a 0`);
    }
    const costo_unitario = Number(d.costo_unitario);
    if (!Number.isFinite(costo_unitario) || costo_unitario < 0) {
      throw new HttpError(400, `Línea ${i + 1}: El costo unitario no puede ser negativo`);
    }
  }

  return {
    proveedor_id,
    fecha,
    numero_factura: numero_factura || null,
    serie: serie || null,
    condicion,
    fecha_vencimiento,
    orden_compra_id,
    notas: notas || null,
    adjunto_factura: adjunto_factura || null,
    detalles: detalles.map(d => ({
      producto_id: Number(d.producto_id),
      cantidad: Number(d.cantidad),
      costo_unitario: Number(d.costo_unitario)
    }))
  };
}

function validarCrear(datos = {}) {
  return baseValidacion(datos);
}

function validarActualizar(datos = {}) {
  if (Array.isArray(datos.detalles)) {
    throw new HttpError(400, 'Los productos de una compra no se pueden editar; anule y registre una nueva factura');
  }

  const fecha = datos.fecha ? String(datos.fecha).trim() : '';
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new HttpError(400, 'La fecha es requerida y debe tener formato YYYY-MM-DD');
  }

  const numero_factura = typeof datos.numero_factura === 'string' ? datos.numero_factura.trim().toUpperCase() : '';
  if (numero_factura.length > 50) {
    throw new HttpError(400, 'El número de factura no puede exceder 50 caracteres');
  }

  const serie = typeof datos.serie === 'string' ? datos.serie.trim().toUpperCase() : '';
  if (serie.length > 20) {
    throw new HttpError(400, 'La serie no puede exceder 20 caracteres');
  }

  const condicion = datos.condicion === 'credito' ? 'credito' : 'contado';
  let fecha_vencimiento = null;
  if (condicion === 'credito') {
    fecha_vencimiento = datos.fecha_vencimiento ? String(datos.fecha_vencimiento).trim() : '';
    if (!fecha_vencimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
      throw new HttpError(400, 'En compras a crédito, la fecha de vencimiento es requerida');
    }
  }

  const notas = typeof datos.notas === 'string' ? datos.notas.trim() : '';

  return {
    fecha,
    numero_factura: numero_factura || null,
    serie: serie || null,
    condicion,
    fecha_vencimiento,
    notas: notas || null
  };
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    numero: fila.numero,
    proveedor_id: fila.proveedor_id,
    proveedor_nombre: fila.proveedor_nombre,
    proveedor_nit: fila.proveedor_nit || null,
    fecha: fila.fecha,
    numero_factura: fila.numero_factura,
    serie: fila.serie,
    condicion: fila.condicion,
    fecha_vencimiento: fila.fecha_vencimiento,
    subtotal: Number(fila.subtotal || 0),
    iva: Number(fila.iva || 0),
    total: Number(fila.total || 0),
    monto_pagado: Number(fila.monto_pagado || 0),
    saldo_pendiente: Number(fila.saldo_pendiente || 0),
    estado_pago: fila.estado_pago,
    estado: fila.estado,
    orden_compra_id: fila.orden_compra_id,
    notas: fila.notas,
    usuario_id: fila.usuario_id,
    usuario_nombre: fila.usuario_nombre,
    adjunto_factura: fila.adjunto_factura,
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    anulada_en: fila.anulada_en,
    anulada_por: fila.anulada_por,
    anulacion_motivo: fila.anulacion_motivo
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

function serializarDetalle(fila, detalles = [], pagos = []) {
  if (!fila) return null;
  const base = serializar(fila);
  return {
    ...base,
    detalles: detalles.map(d => ({
      id: d.id,
      producto_id: d.producto_id,
      producto_codigo: d.producto_codigo,
      producto_nombre: d.producto_nombre,
      unidad_medida: d.unidad_medida,
      cantidad: Number(d.cantidad || 0),
      costo_unitario: Number(d.costo_unitario || 0),
      subtotal: Number(d.subtotal || 0)
    })),
    pagos: pagos.map(p => ({
      id: p.id,
      fecha: p.fecha,
      monto: Number(p.monto || 0),
      metodo: p.metodo,
      referencia: p.referencia,
      notas: p.notas,
      estado: p.estado,
      anulado_en: p.anulado_en,
      anulado_por: p.anulado_por,
      anulacion_motivo: p.anulacion_motivo,
      usuario_id: p.usuario_id,
      usuario_nombre: p.usuario_nombre
    }))
  };
}

function calcularTotales(detalles) {
  let subtotal = 0;
  for (const d of detalles) {
    const st = d.cantidad * d.costo_unitario;
    subtotal += st;
  }
  subtotal = redondear2(subtotal);
  const iva = redondear2(subtotal * IVA_FACTOR);
  const total = redondear2(subtotal + iva);
  return { subtotal, iva, total };
}

module.exports = {
  IVA_PORCENTAJE,
  IVA_FACTOR,
  redondear2,
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista,
  serializarDetalle,
  calcularTotales
};