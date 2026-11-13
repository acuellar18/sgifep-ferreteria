const { HttpError } = require('../utils/http-error');

const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'credito'];
const ESTADOS = ['todas', 'completada', 'anulada'];

function redondear2(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
}

function fecha(valor, etiqueta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) {
    throw new HttpError(400, `${etiqueta} debe tener formato AAAA-MM-DD`);
  }
  return String(valor);
}

function formatearLocal(fecha) {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function validarFiltros(query = {}) {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const desde = fecha(query.desde || formatearLocal(inicioMes), 'La fecha inicial');
  const hasta = fecha(query.hasta || formatearLocal(hoy), 'La fecha final');
  if (desde > hasta) {
    throw new HttpError(400, 'La fecha inicial no puede ser mayor que la final');
  }

  const metodo_pago = METODOS.includes(query.metodo_pago) ? query.metodo_pago : '';
  const estado = ESTADOS.includes(query.estado) ? query.estado : 'completada';
  const cajero = query.cajero ? Number(query.cajero) : null;
  if (query.cajero && (!Number.isInteger(cajero) || cajero <= 0)) {
    throw new HttpError(400, 'El cajero indicado no es válido');
  }

  return { desde, hasta, metodo_pago, estado, cajero };
}

function serializarResumen(resumen, anuladas, devoluciones) {
  const ventasTotal = redondear2(resumen.ventas_total);
  const devolucionesTotal = redondear2(devoluciones.devoluciones_total);
  return {
    ventas_count: Number(resumen.ventas_count || 0),
    ventas_total: ventasTotal,
    ticket_promedio: redondear2(resumen.ticket_promedio),
    efectivo: redondear2(resumen.efectivo),
    tarjeta: redondear2(resumen.tarjeta),
    transferencia: redondear2(resumen.transferencia),
    anuladas_count: Number(anuladas.anuladas_count || 0),
    anuladas_total: redondear2(anuladas.anuladas_total),
    devoluciones_count: Number(devoluciones.devoluciones_count || 0),
    devoluciones_total: devolucionesTotal,
    devoluciones_efectivo: redondear2(devoluciones.devoluciones_efectivo),
    neto: redondear2(ventasTotal - devolucionesTotal)
  };
}

function serializarDia(fila) {
  return {
    fecha: fila.fecha,
    ventas_count: Number(fila.ventas_count || 0),
    total: redondear2(fila.total),
    efectivo: redondear2(fila.efectivo),
    tarjeta: redondear2(fila.tarjeta),
    transferencia: redondear2(fila.transferencia)
  };
}

function serializarMetodo(fila) {
  return {
    metodo_pago: fila.metodo_pago,
    ventas_count: Number(fila.ventas_count || 0),
    total: redondear2(fila.total)
  };
}

function serializarCajero(fila) {
  return {
    usuario_id: Number(fila.usuario_id),
    cajero: fila.cajero,
    ventas_count: Number(fila.ventas_count || 0),
    total: redondear2(fila.total)
  };
}

function serializarProducto(fila) {
  return {
    producto_id: Number(fila.producto_id),
    producto_codigo: fila.producto_codigo,
    producto_nombre: fila.producto_nombre,
    cantidad: Number(fila.cantidad || 0),
    total: redondear2(fila.total)
  };
}

function serializarVenta(fila) {
  return {
    id: Number(fila.id),
    numero: fila.numero,
    total: redondear2(fila.total),
    metodo_pago: fila.metodo_pago,
    estado: fila.estado,
    creado_en: fila.creado_en,
    cliente_nombre: fila.cliente_nombre || null,
    cliente_nit: fila.cliente_nit || null,
    cajero: fila.cajero || null
  };
}

module.exports = {
  redondear2,
  validarFiltros,
  serializarResumen,
  serializarDia,
  serializarMetodo,
  serializarCajero,
  serializarProducto,
  serializarVenta
};
