// Verifica la integridad de los datos y de las reglas de Compras.
// Uso: npm run verificar-compras (en backend/)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../db');
const { redondear2 } = require('./lib/compras-seed-data');

const TRIGGERS_ESPERADOS = [
  'trg_pagos_compra_before_insert',
  'trg_pagos_compra_before_update',
  'trg_pagos_compra_before_delete',
  'trg_pagos_compra_after_insert',
  'trg_pagos_compra_after_update',
  'trg_compras_before_delete',
  'trg_compras_before_update',
  'trg_compras_after_insert',
  'trg_compras_after_update',
  'trg_compras_after_delete',
  'trg_movimientos_before_update',
  'trg_movimientos_before_delete',
  'trg_movimientos_after_insert',
  'trg_detalle_orden_after_insert',
  'trg_detalle_orden_after_update',
  'trg_detalle_orden_after_delete',
  'trg_ordenes_after_insert',
  'trg_ordenes_after_update',
  'trg_ordenes_after_delete',
  'trg_proveedores_after_insert',
  'trg_proveedores_after_update',
  'trg_proveedores_after_delete'
];

const TABLAS_REQUERIDAS = [
  'compras',
  'detalle_compra',
  'pagos_compra',
  'ordenes_compra',
  'detalle_orden_compra',
  'movimientos_inventario',
  'secuencias',
  'bitacora_auditoria'
];

function fechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
}

function dinero(valor) {
  return `Q${Number(valor || 0).toFixed(2)}`;
}

function estadoPagoEsperado(total, pagado) {
  const saldo = Number(total) - Number(pagado);
  if (saldo <= 0.01) return 'pagada';
  if (Number(pagado) > 0) return 'parcial';
  return 'pendiente';
}

async function main() {
  const [tablas] = await pool.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
    [TABLAS_REQUERIDAS]
  );
  const tablasExistentes = new Set(tablas.map((t) => t.TABLE_NAME));
  const tablasFaltantes = TABLAS_REQUERIDAS.filter((t) => !tablasExistentes.has(t));

  if (tablasFaltantes.length) {
    console.log('=== VERIFICACIÓN DE INTEGRIDAD DE COMPRAS ===');
    console.log(`Faltan tablas: ${tablasFaltantes.join(', ')}`);
    console.log('Ejecute primero: npm run migrate');
    process.exitCode = 1;
    return;
  }

  const [triggers] = await pool.query(
    `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = DATABASE()`
  );
  const triggersExistentes = new Set(triggers.map((t) => t.TRIGGER_NAME));
  const triggersFaltantes = TRIGGERS_ESPERADOS.filter((t) => !triggersExistentes.has(t));

  const [compras] = await pool.query(
    `SELECT c.*, p.nombre AS proveedor_nombre
     FROM compras c
     LEFT JOIN proveedores p ON p.id = c.proveedor_id
     ORDER BY c.id`
  );

  const problemasTotales = [];
  const problemasFinanzas = [];
  const anuladasConPagos = [];
  const detallesDuplicados = [];
  const pagosDuplicados = [];
  const pagosInvalidos = [];
  const comprasSinDetalle = [];

  for (const compra of compras) {
    const [detalles] = await pool.query(
      `SELECT id, producto_id, cantidad, costo_unitario, subtotal
       FROM detalle_compra
       WHERE compra_id = ?
       ORDER BY id`,
      [compra.id]
    );

    const [pagos] = await pool.query(
      `SELECT id, fecha, monto, metodo, referencia, notas, estado,
              anulado_por, anulacion_motivo
       FROM pagos_compra
       WHERE compra_id = ?
       ORDER BY id`,
      [compra.id]
    );

    if (!detalles.length) {
      comprasSinDetalle.push({ compra_id: compra.id, numero: compra.numero });
    }

    const sumaDetalle = redondear2(
      detalles.reduce((suma, d) => suma + Number(d.subtotal), 0)
    );
    const ivaEsperado = redondear2(sumaDetalle * 0.12);
    const totalEsperado = redondear2(sumaDetalle + ivaEsperado);

    if (
      redondear2(Number(compra.subtotal)) !== sumaDetalle ||
      redondear2(Number(compra.iva)) !== ivaEsperado ||
      redondear2(Number(compra.total)) !== totalEsperado
    ) {
      problemasTotales.push({
        compra_id: compra.id,
        numero: compra.numero,
        estado: compra.estado,
        subtotal_guardado: Number(compra.subtotal),
        subtotal_detalle: sumaDetalle,
        iva_guardado: Number(compra.iva),
        iva_esperado: ivaEsperado,
        total_guardado: Number(compra.total),
        total_esperado: totalEsperado
      });
    }

    const gruposDetalle = new Map();
    for (const detalle of detalles) {
      const clave = [
        detalle.producto_id,
        Number(detalle.cantidad),
        Number(detalle.costo_unitario),
        Number(detalle.subtotal)
      ].join('|');
      if (!gruposDetalle.has(clave)) gruposDetalle.set(clave, []);
      gruposDetalle.get(clave).push(detalle);
    }
    for (const grupo of gruposDetalle.values()) {
      if (grupo.length > 1) {
        detallesDuplicados.push({
          compra_id: compra.id,
          numero: compra.numero,
          producto_id: grupo[0].producto_id,
          cantidad: Number(grupo[0].cantidad),
          costo_unitario: Number(grupo[0].costo_unitario),
          veces: grupo.length,
          ids: grupo.map((d) => d.id).join(', ')
        });
      }
    }

    const pagosActivos = pagos.filter((p) => p.estado === 'activo');
    const sumaPagos = redondear2(
      pagosActivos.reduce((suma, pago) => suma + Number(pago.monto), 0)
    );

    for (const pago of pagos) {
      if (pago.estado === 'anulado') {
        if (!pago.anulado_por || !pago.anulacion_motivo) {
          pagosInvalidos.push({
            pago_id: pago.id,
            compra_id: compra.id,
            numero: compra.numero,
            problema: 'Pago anulado sin usuario o motivo'
          });
        }
      }
    }

    const gruposPago = new Map();
    for (const pago of pagosActivos) {
      const clave = [
        fechaISO(pago.fecha),
        Number(pago.monto),
        pago.metodo,
        pago.referencia || '',
        pago.notas || ''
      ].join('|');
      if (!gruposPago.has(clave)) gruposPago.set(clave, []);
      gruposPago.get(clave).push(pago);
    }
    for (const grupo of gruposPago.values()) {
      if (grupo.length > 1) {
        pagosDuplicados.push({
          compra_id: compra.id,
          numero: compra.numero,
          fecha: fechaISO(grupo[0].fecha),
          monto: Number(grupo[0].monto),
          referencia: grupo[0].referencia || '',
          veces: grupo.length,
          ids: grupo.map((p) => p.id).join(', ')
        });
      }
    }

    if (compra.estado === 'anulada' && pagosActivos.length) {
      anuladasConPagos.push({
        compra_id: compra.id,
        numero: compra.numero,
        pagos_activos: pagosActivos.length,
        monto: sumaPagos
      });
    }

    const saldoEsperado = redondear2(Math.max(0, Number(compra.total) - sumaPagos));
    const estadoEsperado = estadoPagoEsperado(compra.total, sumaPagos);
    const diferenciaSaldo = redondear2(Number(compra.saldo_pendiente) - saldoEsperado);

    if (
      Math.abs(diferenciaSaldo) > 0.01 ||
      redondear2(Number(compra.monto_pagado)) !== sumaPagos ||
      (compra.estado === 'recibida' && compra.estado_pago !== estadoEsperado)
    ) {
      problemasFinanzas.push({
        compra_id: compra.id,
        numero: compra.numero,
        estado: compra.estado,
        total: Number(compra.total),
        pagos_activos: sumaPagos,
        monto_guardado: Number(compra.monto_pagado),
        saldo_guardado: Number(compra.saldo_pendiente),
        saldo_esperado: compra.estado === 'anulada' ? 0 : saldoEsperado,
        estado_pago_guardado: compra.estado_pago,
        estado_pago_esperado: compra.estado === 'anulada' ? 'pagada' : estadoEsperado
      });
    }

    if (sumaPagos > Number(compra.total) + 0.01) {
      pagosInvalidos.push({
        pago_id: null,
        compra_id: compra.id,
        numero: compra.numero,
        problema: `Pagos activos (${dinero(sumaPagos)}) exceden el total (${dinero(compra.total)})`
      });
    }
  }

  const [stock] = await pool.query(
    `SELECT p.id, p.codigo, p.nombre, p.stock_actual,
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE -m.cantidad END), 0) AS stock_ledger
     FROM productos p
     LEFT JOIN movimientos_inventario m ON m.producto_id = p.id
     GROUP BY p.id, p.codigo, p.nombre, p.stock_actual
     HAVING ABS(p.stock_actual - stock_ledger) > 0.001 OR p.stock_actual < 0`
  );

  const [ordenes] = await pool.query(
    `SELECT oc.id, oc.numero,
            oc.subtotal_estimado, oc.iva_estimado, oc.total_estimado,
            COALESCE(SUM(doc.cantidad_solicitada * doc.costo_estimado), 0) AS subtotal_calculado
     FROM ordenes_compra oc
     LEFT JOIN detalle_orden_compra doc ON doc.orden_id = oc.id
     GROUP BY oc.id, oc.numero, oc.subtotal_estimado, oc.iva_estimado, oc.total_estimado
     ORDER BY oc.id`
  );

  const problemasOrdenes = [];
  for (const orden of ordenes) {
    const subtotal = redondear2(Number(orden.subtotal_calculado));
    const iva = redondear2(subtotal * 0.12);
    const total = redondear2(subtotal + iva);
    if (
      redondear2(Number(orden.subtotal_estimado)) !== subtotal ||
      redondear2(Number(orden.iva_estimado)) !== iva ||
      redondear2(Number(orden.total_estimado)) !== total
    ) {
      problemasOrdenes.push({
        orden_id: orden.id,
        numero: orden.numero,
        subtotal_guardado: Number(orden.subtotal_estimado),
        iva_guardado: Number(orden.iva_estimado),
        total_guardado: Number(orden.total_estimado),
        subtotal_esperado: subtotal,
        iva_esperado: iva,
        total_esperado: total
      });
    }
  }

  const [secuencias] = await pool.query('SELECT nombre, anio, valor FROM secuencias');
  const mapaSecuencias = new Map(secuencias.map((s) => [`${s.nombre}|${s.anio}`, Number(s.valor)]));

  const [maxCompras] = await pool.query(
    `SELECT CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED) AS anio,
            MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED)) AS maximo
     FROM compras
     WHERE numero REGEXP '^C-[0-9]{4}-[0-9]+$'
     GROUP BY CAST(SUBSTRING(numero, 3, 4) AS UNSIGNED)`
  );
  const [maxOrdenes] = await pool.query(
    `SELECT CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED) AS anio,
            MAX(CAST(SUBSTRING(numero, 9) AS UNSIGNED)) AS maximo
     FROM ordenes_compra
     WHERE numero REGEXP '^OC-[0-9]{4}-[0-9]+$'
     GROUP BY CAST(SUBSTRING(numero, 4, 4) AS UNSIGNED)`
  );

  const problemasSecuencias = [];
  for (const fila of [
    ...maxCompras.map((f) => ({ nombre: 'compras', ...f })),
    ...maxOrdenes.map((f) => ({ nombre: 'ordenes_compra', ...f }))
  ]) {
    const clave = `${fila.nombre}|${fila.anio}`;
    const valor = mapaSecuencias.get(clave);
    if (valor === undefined || valor < Number(fila.maximo)) {
      problemasSecuencias.push({
        secuencia: clave,
        valor_actual: valor ?? null,
        minimo_requerido: Number(fila.maximo)
      });
    }
  }

  console.log('=== VERIFICACIÓN DE INTEGRIDAD DE COMPRAS ===');
  console.log(`Compras revisadas: ${compras.length}`);
  console.log(`Órdenes revisadas: ${ordenes.length}`);
  console.log('');

  const secciones = [
    ['1. Tablas faltantes', tablasFaltantes],
    ['2. Triggers faltantes', triggersFaltantes],
    ['3. Totales inconsistentes', problemasTotales],
    ['4. Compras sin detalle', comprasSinDetalle],
    ['5. Detalles duplicados exactos', detallesDuplicados],
    ['6. Finanzas inconsistentes (pagos/saldo/estado)', problemasFinanzas],
    ['7. Compras anuladas con pagos activos', anuladasConPagos],
    ['8. Pagos inválidos', pagosInvalidos],
    ['9. Pagos activos duplicados', pagosDuplicados],
    ['10. Stock distinto al ledger o negativo', stock],
    ['11. Totales de órdenes inconsistentes', problemasOrdenes],
    ['12. Secuencias desactualizadas', problemasSecuencias]
  ];

  for (const [titulo, filas] of secciones) {
    console.log(`${titulo}: ${filas.length}`);
    if (filas.length) console.table(filas);
    console.log('');
  }

  const hayProblemas = secciones.some(([, filas]) => filas.length > 0);
  if (hayProblemas) {
    console.log('RESULTADO: se encontraron problemas de integridad.');
    process.exitCode = 1;
  } else {
    console.log('RESULTADO: datos y reglas de Compras íntegros.');
  }
}

main()
  .catch((error) => {
    console.error('Error al verificar compras:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.pool.end();
    } catch (error) {
      // Ignorar errores al cerrar el pool.
    }
  });
