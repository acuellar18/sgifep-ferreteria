const { HttpError } = require('../utils/http-error');

function numero(valor) {
  return Number(valor || 0);
}

function redondear2(valor) {
  return Math.round((numero(valor) + Number.EPSILON) * 100) / 100;
}

function validarMonto(valor, etiqueta) {
  const monto = Number(valor);
  if (!Number.isFinite(monto) || monto < 0) {
    throw new HttpError(400, `${etiqueta} debe ser un monto válido`);
  }
  if (monto > 99999999.99) {
    throw new HttpError(400, `${etiqueta} es demasiado alto`);
  }
  return redondear2(monto);
}

function validarApertura(datos = {}) {
  return { monto_inicial: validarMonto(datos.monto_inicial ?? 0, 'El monto inicial') };
}

const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];

function validarDenominaciones(datos) {
  const entrada = datos.denominaciones;
  if (entrada === undefined || entrada === null) return null;

  const mapa = new Map();
  if (Array.isArray(entrada)) {
    for (const item of entrada) {
      const denominacion = Number(item?.denominacion);
      const cantidad = Number(item?.cantidad);
      if (!DENOMINACIONES.includes(denominacion)) {
        throw new HttpError(400, 'Hay una denominación de efectivo inválida');
      }
      if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 1000000) {
        throw new HttpError(400, 'Las cantidades del arqueo deben ser enteros válidos');
      }
      mapa.set(denominacion, cantidad);
    }
  } else if (typeof entrada === 'object') {
    for (const [clave, valor] of Object.entries(entrada)) {
      const denominacion = Number(clave);
      const cantidad = Number(valor);
      if (!DENOMINACIONES.includes(denominacion)) {
        throw new HttpError(400, 'Hay una denominación de efectivo inválida');
      }
      if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 1000000) {
        throw new HttpError(400, 'Las cantidades del arqueo deben ser enteros válidos');
      }
      mapa.set(denominacion, cantidad);
    }
  } else {
    throw new HttpError(400, 'El detalle del arqueo no es válido');
  }

  return DENOMINACIONES.map((denominacion) => {
    const cantidad = mapa.get(denominacion) || 0;
    return {
      denominacion,
      cantidad,
      subtotal: redondear2(denominacion * cantidad)
    };
  });
}

function validarCierre(datos = {}) {
  const arqueo = validarDenominaciones(datos);
  const montoDesdeArqueo = arqueo
    ? redondear2(arqueo.reduce((suma, item) => suma + item.subtotal, 0))
    : null;
  const monto_contado = arqueo
    ? montoDesdeArqueo
    : validarMonto(datos.monto_contado, 'El efectivo contado');

  const monto_contado_tarjeta = validarMonto(
    datos.monto_contado_tarjeta ?? 0,
    'El monto contado de tarjeta'
  );
  const monto_contado_transferencia = validarMonto(
    datos.monto_contado_transferencia ?? 0,
    'El monto contado de transferencia'
  );

  const observaciones = typeof datos.observaciones === 'string'
    ? datos.observaciones.trim()
    : '';
  if (observaciones.length > 500) {
    throw new HttpError(400, 'Las observaciones no pueden superar los 500 caracteres');
  }

  return {
    monto_contado,
    monto_contado_tarjeta,
    monto_contado_transferencia,
    arqueo_detalle: arqueo ? JSON.stringify(arqueo) : null,
    observaciones: observaciones || null
  };
}

function serializarSesion(fila, resumen = null) {
  if (!fila) return null;
  const valor = (campo) => (resumen ? resumen[campo] : fila[campo]);

  let arqueo = null;
  if (fila.arqueo_detalle) {
    try {
      arqueo = JSON.parse(fila.arqueo_detalle);
    } catch {
      arqueo = null;
    }
  }

  return {
    id: Number(fila.id),
    estado: fila.estado,
    monto_inicial: redondear2(fila.monto_inicial),
    fecha_apertura: fila.fecha_apertura,
    fecha_cierre: fila.fecha_cierre,
    ventas_count: Number(valor('ventas_count') || 0),
    ventas_total: redondear2(valor('ventas_total')),
    ventas_efectivo: redondear2(valor('ventas_efectivo')),
    ventas_tarjeta: redondear2(valor('ventas_tarjeta')),
    ventas_transferencia: redondear2(valor('ventas_transferencia')),
    cobros_count: Number(valor('cobros_count') || 0),
    cobros_total: redondear2(valor('cobros_total')),
    cobros_efectivo: redondear2(valor('cobros_efectivo')),
    cobros_tarjeta: redondear2(valor('cobros_tarjeta')),
    cobros_transferencia: redondear2(valor('cobros_transferencia')),
    devoluciones_count: Number(valor('devoluciones_count') || 0),
    devoluciones_total: redondear2(valor('devoluciones_total')),
    devoluciones_efectivo: redondear2(valor('devoluciones_efectivo')),
    devoluciones_tarjeta: redondear2(valor('devoluciones_tarjeta')),
    devoluciones_transferencia: redondear2(valor('devoluciones_transferencia')),
    efectivo_esperado: redondear2(valor('efectivo_esperado')),
    monto_contado: fila.monto_contado === null ? null : redondear2(fila.monto_contado),
    monto_contado_tarjeta: fila.monto_contado_tarjeta === null
      ? null
      : redondear2(fila.monto_contado_tarjeta),
    monto_contado_transferencia: fila.monto_contado_transferencia === null
      ? null
      : redondear2(fila.monto_contado_transferencia),
    diferencia: fila.diferencia === null ? null : redondear2(fila.diferencia),
    arqueo_detalle: arqueo,
    observaciones: fila.observaciones || null
  };
}

module.exports = {
  redondear2,
  validarApertura,
  validarCierre,
  serializarSesion
};
