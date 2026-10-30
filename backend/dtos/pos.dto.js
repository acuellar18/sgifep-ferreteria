const { HttpError } = require('../utils/http-error');

const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
const ESTADOS = ['completada', 'anulada'];

function redondear2(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function redondear3(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 1000) / 1000;
}

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarCliente(datos = {}) {
  const base = datos.cliente && typeof datos.cliente === 'object' ? datos.cliente : {};

  const clienteId = Number(datos.cliente_id ?? base.id);
  const nit = texto(datos.cliente_nit ?? base.nit).toUpperCase();
  const nombre = texto(datos.cliente_nombre ?? base.nombre);
  const telefono = texto(datos.cliente_telefono ?? base.telefono);
  const correo = texto(datos.cliente_correo ?? base.correo).toLowerCase();
  const direccion = texto(datos.cliente_direccion ?? base.direccion);

  if (nit.length > 20) throw new HttpError(400, 'El NIT no puede superar los 20 caracteres');
  if (nombre.length > 150) throw new HttpError(400, 'El nombre del cliente no puede superar los 150 caracteres');
  if (telefono.length > 30) throw new HttpError(400, 'El teléfono no puede superar los 30 caracteres');
  if (correo.length > 150) throw new HttpError(400, 'El correo no puede superar los 150 caracteres');
  if (direccion.length > 255) throw new HttpError(400, 'La dirección no puede superar los 255 caracteres');

  return {
    cliente_id: Number.isInteger(clienteId) && clienteId > 0 ? clienteId : null,
    nit: nit || null,
    nombre: nombre || null,
    telefono: telefono || null,
    correo: correo || null,
    direccion: direccion || null
  };
}

function validarDetalles(detalles) {
  const lista = Array.isArray(detalles) ? detalles : [];
  if (!lista.length) {
    throw new HttpError(400, 'Agrega al menos un producto o servicio a la venta');
  }

  const vistos = new Set();
  return lista.map((detalle, indice) => {
    const productoId = Number(detalle.producto_id);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: falta seleccionar un producto`);
    }
    if (vistos.has(productoId)) {
      throw new HttpError(400, `Línea ${indice + 1}: el producto está repetido`);
    }
    vistos.add(productoId);

    const cantidad = Number(detalle.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: la cantidad debe ser mayor a 0`);
    }
    if (cantidad > 999999999.999) {
      throw new HttpError(400, `Línea ${indice + 1}: la cantidad excede el máximo permitido`);
    }

    const descuento = Number(detalle.descuento ?? 0);
    if (!Number.isFinite(descuento) || descuento < 0) {
      throw new HttpError(400, `Línea ${indice + 1}: el descuento no puede ser negativo`);
    }

    return {
      producto_id: productoId,
      cantidad: redondear3(cantidad),
      descuento: redondear2(descuento)
    };
  });
}

function validarCrear(datos = {}) {
  const metodoPago = texto(datos.metodo_pago).toLowerCase();
  if (!METODOS_PAGO.includes(metodoPago)) {
    throw new HttpError(400, 'El método de pago debe ser efectivo, tarjeta o transferencia');
  }

  const referencia = texto(datos.referencia);
  if (metodoPago === 'transferencia' && !referencia) {
    throw new HttpError(400, 'La referencia o autorización es obligatoria para transferencias');
  }
  if (referencia.length > 100) {
    throw new HttpError(400, 'La referencia no puede superar los 100 caracteres');
  }

  const observaciones = texto(datos.observaciones);
  if (observaciones.length > 255) {
    throw new HttpError(400, 'Las observaciones no pueden superar los 255 caracteres');
  }

  const montoRecibido = datos.monto_recibido === undefined || datos.monto_recibido === null
    ? null
    : Number(datos.monto_recibido);
  if (montoRecibido !== null && (!Number.isFinite(montoRecibido) || montoRecibido < 0)) {
    throw new HttpError(400, 'El monto recibido debe ser un número mayor o igual a 0');
  }

  return {
    cliente: normalizarCliente(datos),
    metodo_pago: metodoPago,
    referencia: referencia || null,
    observaciones: observaciones || null,
    monto_recibido: montoRecibido,
    detalles: validarDetalles(datos.detalles)
  };
}

function validarPagoCredito(datos = {}) {
  const metodoPago = texto(datos.metodo_pago).toLowerCase();
  if (!METODOS_PAGO.includes(metodoPago)) {
    throw new HttpError(400, 'El método de pago debe ser efectivo, tarjeta o transferencia');
  }

  const monto = Number(datos.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new HttpError(400, 'El monto del pago debe ser mayor a 0');
  }
  if (monto > 99999999.99) {
    throw new HttpError(400, 'El monto del pago es demasiado alto');
  }

  const referencia = texto(datos.referencia);
  if (metodoPago === 'transferencia' && !referencia) {
    throw new HttpError(400, 'La referencia es obligatoria para transferencias');
  }
  if (referencia.length > 100) {
    throw new HttpError(400, 'La referencia no puede superar los 100 caracteres');
  }

  const notas = texto(datos.notas);
  if (notas.length > 255) {
    throw new HttpError(400, 'Las notas no pueden superar los 255 caracteres');
  }

  return {
    metodo_pago: metodoPago,
    monto: redondear2(monto),
    referencia: referencia || null,
    notas: notas || null
  };
}

function validarDevolucion(datos = {}) {
  const tipo = texto(datos.tipo).toLowerCase() === 'nota_credito'
    ? 'nota_credito'
    : 'reembolso';
  const metodoPago = texto(datos.metodo_pago).toLowerCase();
  const metodos = ['efectivo', 'tarjeta', 'transferencia', 'credito'];
  if (!metodos.includes(metodoPago)) {
    throw new HttpError(400, 'El método de devolución no es válido');
  }
  if (tipo === 'nota_credito' && metodoPago !== 'credito') {
    throw new HttpError(400, 'La nota de crédito debe registrarse con método crédito');
  }

  const motivo = texto(datos.motivo);
  if (!motivo) throw new HttpError(400, 'El motivo de la devolución es requerido');
  if (motivo.length > 255) {
    throw new HttpError(400, 'El motivo no puede superar los 255 caracteres');
  }

  const lista = Array.isArray(datos.detalles) ? datos.detalles : [];
  if (!lista.length) {
    throw new HttpError(400, 'Selecciona al menos un producto para devolver');
  }

  const vistos = new Set();
  const detalles = lista.map((detalle, indice) => {
    const detalleId = Number(detalle.detalle_venta_id);
    if (!Number.isInteger(detalleId) || detalleId <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: detalle de venta inválido`);
    }
    if (vistos.has(detalleId)) {
      throw new HttpError(400, `Línea ${indice + 1}: el detalle está repetido`);
    }
    vistos.add(detalleId);

    const cantidad = Number(detalle.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new HttpError(400, `Línea ${indice + 1}: la cantidad debe ser mayor a 0`);
    }
    if (cantidad > 999999999.999) {
      throw new HttpError(400, `Línea ${indice + 1}: la cantidad excede el máximo permitido`);
    }

    return {
      detalle_venta_id: detalleId,
      cantidad: redondear3(cantidad)
    };
  });

  return {
    tipo,
    metodo_pago: metodoPago,
    motivo,
    detalles
  };
}

function serializarProducto(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    codigo: fila.codigo,
    codigo_barras: fila.codigo_barras || null,
    nombre: fila.nombre,
    presentacion: fila.presentacion || null,
    unidad_medida: fila.unidad_medida,
    tipo: fila.tipo,
    stock_actual: Number(fila.stock_actual || 0),
    precio_venta: Number(fila.precio_venta || 0)
  };
}

function serializarCliente(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    nit: fila.nit,
    nombre: fila.nombre,
    telefono: fila.telefono || null,
    correo: fila.correo || null,
    direccion: fila.direccion || null,
    estado: fila.estado || 'activo'
  };
}

function serializarVenta(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    numero: fila.numero,
    caja_id: Number(fila.caja_id),
    factura_id: fila.factura_id ? Number(fila.factura_id) : null,
    factura_numero: fila.factura_numero || null,
    cliente_id: Number(fila.cliente_id),
    cliente_nit: fila.cliente_nit || null,
    cliente_nombre: fila.cliente_nombre || null,
    cliente_telefono: fila.cliente_telefono || null,
    cliente_correo: fila.cliente_correo || null,
    cliente_direccion: fila.cliente_direccion || null,
    usuario_id: Number(fila.usuario_id),
    usuario_nombre: fila.usuario_nombre || null,
    subtotal: Number(fila.subtotal || 0),
    iva: Number(fila.iva || 0),
    descuento: Number(fila.descuento || 0),
    total: Number(fila.total || 0),
    metodo_pago: fila.metodo_pago,
    monto_recibido: Number(fila.monto_recibido || 0),
    cambio: Number(fila.cambio || 0),
    referencia: fila.referencia || null,
    estado: fila.estado,
    anulada_en: fila.anulada_en || null,
    anulada_por: fila.anulada_por ? Number(fila.anulada_por) : null,
    anulada_por_nombre: fila.anulada_por_nombre || null,
    anulacion_motivo: fila.anulacion_motivo || null,
    observaciones: fila.observaciones || null,
    caja_fecha_apertura: fila.caja_fecha_apertura || null,
    caja_estado: fila.caja_estado || null,
    lineas: fila.lineas === undefined ? undefined : Number(fila.lineas || 0),
    unidades: fila.unidades === undefined ? undefined : Number(fila.unidades || 0),
    creado_en: fila.creado_en
  };
}

function serializarListaVentas(filas) {
  return filas.map(serializarVenta);
}

function serializarDetalleVenta(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    producto_id: Number(fila.producto_id),
    producto_codigo: fila.producto_codigo,
    producto_nombre: fila.producto_nombre,
    presentacion: fila.presentacion || null,
    unidad_medida: fila.unidad_medida,
    tipo: fila.tipo,
    cantidad: Number(fila.cantidad || 0),
    precio_unitario: Number(fila.precio_unitario || 0),
    descuento: Number(fila.descuento || 0),
    subtotal: Number(fila.subtotal || 0),
    devuelto: Number(fila.devuelto || 0)
  };
}

function serializarDetalle(fila, detalles = []) {
  if (!fila) return null;
  return {
    ...serializarVenta(fila),
    cliente: {
      id: Number(fila.cliente_id),
      nit: fila.cliente_nit,
      nombre: fila.cliente_nombre,
      telefono: fila.cliente_telefono,
      correo: fila.cliente_correo,
      direccion: fila.cliente_direccion
    },
    detalles: detalles.map(serializarDetalleVenta)
  };
}

function serializarCuenta(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    numero: fila.numero,
    cliente_id: Number(fila.cliente_id),
    cliente_nombre: fila.cliente_nombre,
    cliente_nit: fila.cliente_nit,
    fecha: fila.fecha,
    fecha_vencimiento: fila.fecha_vencimiento || null,
    total: Number(fila.total || 0),
    monto_pagado: Number(fila.monto_pagado || 0),
    saldo_pendiente: Number(fila.saldo_pendiente || 0),
    estado_pago: fila.estado_pago,
    dias_vencido: fila.dias_vencido === null || fila.dias_vencido === undefined
      ? null
      : Number(fila.dias_vencido)
  };
}

function serializarCobro(fila) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    factura_id: fila.factura_id ? Number(fila.factura_id) : null,
    venta_id: fila.venta_id ? Number(fila.venta_id) : null,
    cliente_id: Number(fila.cliente_id),
    usuario_id: Number(fila.usuario_id),
    usuario_nombre: fila.usuario_nombre || null,
    caja_id: fila.caja_id ? Number(fila.caja_id) : null,
    metodo_pago: fila.metodo_pago,
    monto: Number(fila.monto || 0),
    referencia: fila.referencia || null,
    notas: fila.notas || null,
    estado: fila.estado,
    creado_en: fila.creado_en
  };
}

function serializarDevolucion(fila, detalles = []) {
  if (!fila) return null;
  return {
    id: Number(fila.id),
    numero: fila.numero,
    venta_id: Number(fila.venta_id),
    factura_id: fila.factura_id ? Number(fila.factura_id) : null,
    cliente_id: Number(fila.cliente_id),
    usuario_id: Number(fila.usuario_id),
    usuario_nombre: fila.usuario_nombre || null,
    caja_id: fila.caja_id ? Number(fila.caja_id) : null,
    tipo: fila.tipo,
    metodo_pago: fila.metodo_pago,
    subtotal: Number(fila.subtotal || 0),
    iva: Number(fila.iva || 0),
    total: Number(fila.total || 0),
    motivo: fila.motivo,
    creado_en: fila.creado_en,
    detalles: detalles.map((detalle) => ({
      id: Number(detalle.id),
      detalle_venta_id: Number(detalle.detalle_venta_id),
      producto_id: Number(detalle.producto_id),
      producto_codigo: detalle.producto_codigo,
      producto_nombre: detalle.producto_nombre,
      tipo: detalle.tipo,
      cantidad: Number(detalle.cantidad || 0),
      precio_unitario: Number(detalle.precio_unitario || 0),
      descuento: Number(detalle.descuento || 0),
      subtotal: Number(detalle.subtotal || 0)
    }))
  };
}

module.exports = {
  METODOS_PAGO,
  ESTADOS,
  redondear2,
  redondear3,
  validarCrear,
  validarPagoCredito,
  validarDevolucion,
  serializarProducto,
  serializarCliente,
  serializarVenta,
  serializarListaVentas,
  serializarDetalle,
  serializarCuenta,
  serializarCobro,
  serializarDevolucion
};
