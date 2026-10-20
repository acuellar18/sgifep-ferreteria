// Datos canónicos de las compras de prueba del módulo Compras.
// Se usan tanto en seed-compras.js como en los scripts de reparación y
// verificación para evitar que cada uno tenga su propia versión del detalle.

const compraDto = require('../../dtos/compra.dto');

const COMPRAS_SEED = [
  {
    numero: 'C-2025-000001',
    proveedor_nit: '1234567-8',
    fecha: '2025-01-15',
    numero_factura: 'FAC-001',
    condicion: 'contado',
    notas: 'Compra contado cemento',
    detalles: [
      { codigo: 'CEM-001', cantidad: 50, costo_unitario: 75.50 },
      { codigo: 'HER-001', cantidad: 20, costo_unitario: 45.00 }
    ],
    pagos: [
      {
        fecha: '2025-01-15',
        metodo: 'efectivo',
        referencia: 'CONT-001',
        notas: 'Pago contado',
        porcentaje: 1
      }
    ]
  },
  {
    numero: 'C-2025-000002',
    proveedor_nit: '2345678-9',
    fecha: '2025-01-20',
    numero_factura: 'FAC-002',
    condicion: 'credito',
    notas: 'Compra crédito tuberías',
    detalles: [
      { codigo: 'TUB-001', cantidad: 100, costo_unitario: 18.50 },
      { codigo: 'TUB-002', cantidad: 50, costo_unitario: 25.00 },
      { codigo: 'TUB-003', cantidad: 30, costo_unitario: 38.00 }
    ],
    pagos: []
  },
  {
    numero: 'C-2025-000003',
    proveedor_nit: '3456789-0',
    fecha: '2025-02-01',
    numero_factura: 'FAC-003',
    condicion: 'credito',
    notas: 'Compra crédito pinturas - pago parcial',
    detalles: [
      { codigo: 'PIN-001', cantidad: 15, costo_unitario: 285.00 },
      { codigo: 'PIN-002', cantidad: 25, costo_unitario: 45.00 }
    ],
    pagos: [
      {
        fecha: '2025-02-10',
        metodo: 'transferencia',
        referencia: 'TRF-001',
        notas: 'Abono 40%',
        porcentaje: 0.4
      }
    ]
  }
];

function redondear2(valor) {
  return Math.round(valor * 100) / 100;
}

function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(dias || 0));
  return d.toISOString().slice(0, 10);
}

function derivarEstadoPago(total, montoPagado) {
  const saldo = Number(total) - Number(montoPagado);
  if (saldo <= 0.01) return 'pagada';
  if (Number(montoPagado) > 0) return 'parcial';
  return 'pendiente';
}

function calcularPagos(definicion, total) {
  return (definicion.pagos || []).map((pago) => ({
    fecha: pago.fecha,
    metodo: pago.metodo,
    referencia: pago.referencia || null,
    notas: pago.notas || null,
    monto: redondear2(Number(total) * Number(pago.porcentaje))
  }));
}

async function resolverDetallesCompra(conn, definicion) {
  const detalles = [];
  for (const linea of definicion.detalles) {
    const [filas] = await conn.query(
      'SELECT id, codigo FROM productos WHERE codigo = ? LIMIT 1',
      [linea.codigo]
    );
    if (!filas.length) {
      throw new Error(`Producto no encontrado para el seed: ${linea.codigo}`);
    }
    detalles.push({
      producto_id: filas[0].id,
      codigo: filas[0].codigo,
      cantidad: Number(linea.cantidad),
      costo_unitario: Number(linea.costo_unitario)
    });
  }
  return detalles;
}

function calcularCompra(definicion, detalles, diasCredito = 0) {
  const totales = compraDto.calcularTotales(detalles);
  const pagos = calcularPagos(definicion, totales.total);
  const montoPagado = redondear2(pagos.reduce((suma, pago) => suma + pago.monto, 0));
  const saldoPendiente = redondear2(Math.max(0, totales.total - montoPagado));

  return {
    ...totales,
    pagos,
    monto_pagado: montoPagado,
    saldo_pendiente: saldoPendiente,
    estado_pago: derivarEstadoPago(totales.total, montoPagado),
    fecha_vencimiento:
      definicion.condicion === 'contado'
        ? definicion.fecha
        : sumarDias(definicion.fecha, diasCredito)
  };
}

module.exports = {
  COMPRAS_SEED,
  redondear2,
  sumarDias,
  derivarEstadoPago,
  calcularPagos,
  resolverDetallesCompra,
  calcularCompra
};
