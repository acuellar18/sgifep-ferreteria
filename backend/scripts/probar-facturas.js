const jwt = require('jsonwebtoken');
const app = require('../server');
const db = require('../db');
const { jwt: jwtConfig } = require('../config/auth');

let fallos = 0;

function check(nombre, condicion, detalle = '') {
  if (condicion) {
    console.log('OK  ', nombre);
  } else {
    fallos += 1;
    console.error('FAIL', nombre, detalle);
  }
}

function token(roles, superadmin = false) {
  return jwt.sign(
    { sub: 1, username: `prueba_${roles[0]}`, nombre: 'Prueba', roles, superadmin },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fecha, dias) {
  const date = new Date(`${fecha}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tokens = {
    administrador: token(['administrador']),
    ventas: token(['ventas']),
    caja: token(['caja']),
    bodega: token(['bodega']),
    compras: token(['compras']),
    reparto: token(['reparto'])
  };

  async function api(ruta, rol, metodo = 'GET', body) {
    const res = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${tokens[rol]}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* sin JSON */ }
    return { status: res.status, body: json };
  }

  const sufijo = Date.now();
  const nit = `FAC-${sufijo}`;
  const codigoProducto = `PRF-${sufijo}`;
  const codigoServicio = `SRF-${sufijo}`;
  const facturaIds = [];
  let clienteId = null;
  let productoId = null;
  let servicioId = null;
  const fecha = hoy();

  try {
    console.log('\n--- Permisos ---');
    for (const rol of ['administrador', 'ventas', 'caja']) {
      const listado = await api('/api/facturas', rol);
      check(`listar facturas habilitado para ${rol}`, listado.status === 200, `status ${listado.status}`);
    }
    for (const rol of ['bodega', 'compras', 'reparto']) {
      const listado = await api('/api/facturas', rol);
      check(`listar facturas denegado para ${rol}`, listado.status === 403, `status ${listado.status}`);
    }

    const resumenCaja = await api('/api/facturas/resumen', 'caja');
    check('resumen habilitado para caja', resumenCaja.status === 200, JSON.stringify(resumenCaja.body));

    const productosCaja = await api('/api/facturas/productos?q=PRF', 'caja');
    check('buscar productos denegado para caja', productosCaja.status === 403, `status ${productosCaja.status}`);

    const crearCaja = await api('/api/facturas', 'caja', 'POST', {});
    check('emitir factura denegado para caja', crearCaja.status === 403, `status ${crearCaja.status}`);

    const sinToken = await fetch(`${base}/api/facturas`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    console.log('\n--- Preparacion ---');
    const crearCliente = await api('/api/clientes', 'administrador', 'POST', {
      nit,
      nombre: `Cliente factura ${sufijo}`,
      telefono: '5555-0101',
      correo: `factura.${sufijo}@example.com`,
      direccion: 'Zona 1, Guatemala',
      dias_credito: 30,
      limite_credito: 5000,
      estado: 'activo'
    });
    check('crea cliente de prueba', crearCliente.status === 201, JSON.stringify(crearCliente.body));
    clienteId = crearCliente.body?.data?.id;

    const crearProducto = await api('/api/productos', 'administrador', 'POST', {
      codigo: codigoProducto,
      nombre: `Producto factura ${sufijo}`,
      tipo: 'producto',
      unidad_medida: 'UNI',
      stock_minimo: 1,
      precio_venta: 20,
      stock_inicial: 10,
      costo_inicial: 10,
      activo: true
    });
    check('crea producto con stock', crearProducto.status === 201, JSON.stringify(crearProducto.body));
    productoId = crearProducto.body?.data?.id;

    const crearServicio = await api('/api/productos', 'administrador', 'POST', {
      codigo: codigoServicio,
      nombre: `Servicio factura ${sufijo}`,
      tipo: 'servicio',
      unidad_medida: 'UNI',
      stock_minimo: 0,
      precio_venta: 100,
      costo_inicial: 40,
      activo: true
    });
    check('crea servicio sin stock', crearServicio.status === 201, JSON.stringify(crearServicio.body));
    servicioId = crearServicio.body?.data?.id;

    const buscarProductos = await api(`/api/facturas/productos?q=${encodeURIComponent(codigoProducto)}`, 'ventas');
    const productoEncontrado = buscarProductos.body?.data?.find((p) => p.id === productoId);
    check('busca productos para facturar', buscarProductos.status === 200 && Boolean(productoEncontrado), JSON.stringify(buscarProductos.body));
    check('el autocompletado expone precio pero no costos', productoEncontrado?.precio_venta === 20 && productoEncontrado?.costo_promedio === undefined && productoEncontrado?.costo_ultimo === undefined, JSON.stringify(productoEncontrado));

    const resumenAntes = await api('/api/facturas/resumen', 'administrador');
    const antes = resumenAntes.body?.data || {};

    console.log('\n--- Validaciones ---');
    const sinCliente = await api('/api/facturas', 'ventas', 'POST', {
      fecha,
      condicion: 'contado',
      detalles: [{ producto_id: productoId, cantidad: 1, precio_unitario: 20 }]
    });
    check('rechaza factura sin cliente', sinCliente.status === 400, JSON.stringify(sinCliente.body));

    const sinDetalles = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'contado',
      detalles: []
    });
    check('rechaza factura sin detalles', sinDetalles.status === 400, JSON.stringify(sinDetalles.body));

    const cantidadCero = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'contado',
      detalles: [{ producto_id: productoId, cantidad: 0, precio_unitario: 20 }]
    });
    check('rechaza cantidad cero', cantidadCero.status === 400, JSON.stringify(cantidadCero.body));

    const repetido = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'contado',
      detalles: [
        { producto_id: productoId, cantidad: 1, precio_unitario: 20 },
        { producto_id: productoId, cantidad: 1, precio_unitario: 20 }
      ]
    });
    check('rechaza producto repetido', repetido.status === 400, JSON.stringify(repetido.body));

    const sinStock = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'contado',
      detalles: [{ producto_id: productoId, cantidad: 999, precio_unitario: 20 }]
    });
    check('rechaza stock insuficiente', sinStock.status === 409, JSON.stringify(sinStock.body));

    console.log('\n--- Factura al credito ---');
    const crearCredito = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'credito',
      fecha_vencimiento: sumarDias(fecha, 30),
      notas: 'Factura de prueba al credito',
      detalles: [
        { producto_id: productoId, cantidad: 2, precio_unitario: 20 },
        { producto_id: servicioId, cantidad: 1, precio_unitario: 100 }
      ]
    });
    check('emite factura al credito', crearCredito.status === 201, JSON.stringify(crearCredito.body));
    const facturaCreditoId = crearCredito.body?.data?.id;
    const numeroCredito = crearCredito.body?.data?.numero;
    if (facturaCreditoId) facturaIds.push(facturaCreditoId);
    check('genera numero con secuencia FAC', /^FAC-\d{4}-\d{6}$/.test(numeroCredito || ''), String(numeroCredito));

    const detalleCredito = await api(`/api/facturas/${facturaCreditoId}`, 'ventas');
    const fc = detalleCredito.body?.data;
    check('consulta el detalle de la factura', detalleCredito.status === 200, JSON.stringify(detalleCredito.body));
    check('calcula subtotal, IVA y total', fc?.subtotal === 140 && fc?.iva === 16.8 && fc?.total === 156.8, JSON.stringify(fc));
    check('la factura al credito queda pendiente', fc?.estado === 'emitida' && fc?.estado_pago === 'pendiente' && fc?.saldo_pendiente === 156.8, JSON.stringify(fc));
    check('guarda el cliente y sus datos en la factura', fc?.cliente?.id === clienteId && fc?.cliente_nit === nit && fc?.cliente_direccion === 'Zona 1, Guatemala', JSON.stringify(fc?.cliente));
    check('guarda las dos lineas con tipo', fc?.detalles?.length === 2 && fc.detalles.some((d) => d.tipo === 'producto') && fc.detalles.some((d) => d.tipo === 'servicio'), JSON.stringify(fc?.detalles));
    check('el detalle no expone costos', fc?.detalles?.every((d) => d.costo_unitario === undefined), JSON.stringify(fc?.detalles));

    const [stockProducto] = await db.pool.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('descuenta el stock de la factura', Number(stockProducto[0]?.stock_actual) === 8, JSON.stringify(stockProducto[0]));

    const [movVenta] = await db.pool.query(
      `SELECT COUNT(*) AS total, MAX(motivo) AS motivo, MAX(referencia) AS referencia
       FROM movimientos_inventario
       WHERE producto_id = ? AND origen = 'venta' AND referencia_tipo = 'facturas' AND referencia_id = ?`,
      [productoId, facturaCreditoId]
    );
    check(
      'registra movimiento de venta',
      Number(movVenta[0]?.total) === 1 &&
        movVenta[0]?.motivo === 'Venta' &&
        movVenta[0]?.referencia === numeroCredito,
      JSON.stringify(movVenta[0])
    );

    const [movServicio] = await db.pool.query(
      'SELECT COUNT(*) AS total FROM movimientos_inventario WHERE producto_id = ?',
      [servicioId]
    );
    check('el servicio no genera movimiento', Number(movServicio[0]?.total) === 0, JSON.stringify(movServicio[0]));

    const detalleCliente = await api(`/api/clientes/${clienteId}`, 'administrador');
    check('el cliente refleja saldo y facturas pendientes', detalleCliente.body?.data?.saldo_actual === 156.8 && detalleCliente.body?.data?.facturas_pendientes === 1, JSON.stringify(detalleCliente.body?.data));
    check('el historial del cliente incluye la factura', detalleCliente.body?.data?.facturas?.length === 1 && detalleCliente.body?.data?.facturas[0]?.numero === numeroCredito && detalleCliente.body?.data?.facturas[0]?.saldo === 156.8, JSON.stringify(detalleCliente.body?.data?.facturas));

    const listadoCliente = await api(`/api/clientes?q=${encodeURIComponent(nit)}`, 'administrador');
    const clienteListado = listadoCliente.body?.data?.find((c) => c.id === clienteId);
    check('el listado de clientes muestra el saldo real', clienteListado?.saldo_actual === 156.8 && clienteListado?.facturas_pendientes === 1, JSON.stringify(clienteListado));

    const resumenCliente = await api('/api/clientes/resumen', 'administrador');
    check('el resumen de clientes suma el saldo por cobrar', Number(resumenCliente.body?.data?.total_por_cobrar) >= 156.8, JSON.stringify(resumenCliente.body?.data));

    const listado = await api(`/api/facturas?q=${encodeURIComponent(numeroCredito)}`, 'administrador');
    check('busca facturas por numero', listado.status === 200 && listado.body?.data?.some((f) => f.id === facturaCreditoId), JSON.stringify(listado.body));

    const filtro = await api('/api/facturas?estado=emitida&estado_pago=pendiente', 'administrador');
    check('filtra facturas por estado y pago', filtro.status === 200 && filtro.body?.data?.some((f) => f.id === facturaCreditoId), JSON.stringify(filtro.body));

    const impresion = await api(`/api/facturas/${facturaCreditoId}/impresion`, 'ventas');
    check('devuelve datos de impresion', impresion.status === 200 && Boolean(impresion.body?.data?.empresa) && impresion.body?.data?.factura?.numero === numeroCredito, JSON.stringify(impresion.body));

    const resumenDespues = await api('/api/facturas/resumen', 'administrador');
    const despues = resumenDespues.body?.data || {};
    check('el resumen suma la factura al mes', Number(despues.facturado_mes || 0) - Number(antes.facturado_mes || 0) >= 156.8, JSON.stringify(despues));
    check('el resumen muestra saldo por cobrar', Number(despues.total_por_cobrar || 0) - Number(antes.total_por_cobrar || 0) >= 156.8, JSON.stringify(despues));

    console.log('\n--- Factura al contado ---');
    const crearContado = await api('/api/facturas', 'ventas', 'POST', {
      cliente_id: clienteId,
      fecha,
      condicion: 'contado',
      detalles: [{ producto_id: productoId, cantidad: 1, precio_unitario: 20 }]
    });
    check('emite factura al contado', crearContado.status === 201, JSON.stringify(crearContado.body));
    const facturaContadoId = crearContado.body?.data?.id;
    if (facturaContadoId) facturaIds.push(facturaContadoId);

    const detalleContado = await api(`/api/facturas/${facturaContadoId}`, 'administrador');
    check('la factura al contado queda pagada', detalleContado.body?.data?.estado_pago === 'pagada' && detalleContado.body?.data?.monto_pagado === 22.4 && detalleContado.body?.data?.saldo_pendiente === 0, JSON.stringify(detalleContado.body?.data));

    const [stockContado] = await db.pool.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('descuenta el stock de la factura al contado', Number(stockContado[0]?.stock_actual) === 7, JSON.stringify(stockContado[0]));

    const anularVentas = await api(`/api/facturas/${facturaContadoId}/anular`, 'ventas', 'POST', { motivo: 'Prueba' });
    check('anular factura denegado para ventas', anularVentas.status === 403, `status ${anularVentas.status}`);

    const anularSinMotivo = await api(`/api/facturas/${facturaContadoId}/anular`, 'administrador', 'POST', {});
    check('rechaza anulacion sin motivo', anularSinMotivo.status === 400, JSON.stringify(anularSinMotivo.body));

    const anularCredito = await api(`/api/facturas/${facturaCreditoId}/anular`, 'administrador', 'POST', { motivo: 'Prueba de anulacion' });
    check('anula la factura al credito', anularCredito.status === 200, JSON.stringify(anularCredito.body));

    const [stockAnulado] = await db.pool.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('devuelve el stock al anular', Number(stockAnulado[0]?.stock_actual) === 9, JSON.stringify(stockAnulado[0]));

    const [movAnulacion] = await db.pool.query(
      `SELECT COUNT(*) AS total, MAX(motivo) AS motivo, MAX(referencia) AS referencia
       FROM movimientos_inventario
       WHERE producto_id = ? AND origen = 'anulacion_venta' AND referencia_id = ?`,
      [productoId, facturaCreditoId]
    );
    check(
      'registra movimiento de anulacion',
      Number(movAnulacion[0]?.total) === 1 &&
        movAnulacion[0]?.motivo === 'Anulación de venta' &&
        movAnulacion[0]?.referencia === numeroCredito,
      JSON.stringify(movAnulacion[0])
    );

    const detalleAnulado = await api(`/api/facturas/${facturaCreditoId}`, 'administrador');
    check('la factura queda anulada sin saldo', detalleAnulado.body?.data?.estado === 'anulada' && detalleAnulado.body?.data?.saldo_pendiente === 0 && detalleAnulado.body?.data?.anulacion_motivo === 'Prueba de anulacion', JSON.stringify(detalleAnulado.body?.data));

    const clienteAnulado = await api(`/api/clientes/${clienteId}`, 'administrador');
    check('el saldo del cliente se libera al anular', clienteAnulado.body?.data?.saldo_actual === 0 && clienteAnulado.body?.data?.facturas_pendientes === 0, JSON.stringify(clienteAnulado.body?.data));

    const anularOtraVez = await api(`/api/facturas/${facturaCreditoId}/anular`, 'administrador', 'POST', { motivo: 'Otra vez' });
    check('rechaza anular una factura ya anulada', anularOtraVez.status === 409, JSON.stringify(anularOtraVez.body));

    const resumenFinal = await api('/api/facturas/resumen', 'administrador');
    const final = resumenFinal.body?.data || {};
    check('el resumen se revierte al anular', Number(final.facturado_mes || 0) - Number(antes.facturado_mes || 0) >= 22.4 && Number(final.total_por_cobrar || 0) === Number(antes.total_por_cobrar || 0), JSON.stringify(final));

    const inexistente = await api('/api/facturas/999999', 'administrador');
    check('responde 404 para factura inexistente', inexistente.status === 404, `status ${inexistente.status}`);

    console.log('\n--- Anulacion de contado ---');
    const anularContado = await api(`/api/facturas/${facturaContadoId}/anular`, 'administrador', 'POST', { motivo: 'Reverso contado' });
    check('anula la factura al contado', anularContado.status === 200, JSON.stringify(anularContado.body));

    const [stockFinal] = await db.pool.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('el stock vuelve al valor inicial', Number(stockFinal[0]?.stock_actual) === 10, JSON.stringify(stockFinal[0]));

    const filtroPagadas = await api('/api/facturas?estado_pago=pagada', 'administrador');
    check(
      'el filtro de pago excluye facturas anuladas',
      filtroPagadas.status === 200 &&
        filtroPagadas.body?.data?.every((factura) => factura.estado === 'emitida'),
      JSON.stringify(filtroPagadas.body)
    );
  } finally {
    try {
      const connection = await db.pool.getConnection();
      try {
        await connection.query('SET @sgifep_reset = 1');
        if (facturaIds.length) {
          await connection.query('DELETE FROM facturas WHERE id IN (?)', [facturaIds]);
        }
        if (productoId || servicioId) {
          const ids = [productoId, servicioId].filter(Boolean);
          await connection.query('DELETE FROM movimientos_inventario WHERE producto_id IN (?)', [ids]);
          await connection.query('DELETE FROM productos WHERE id IN (?)', [ids]);
        }
        if (clienteId) {
          await connection.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
        }
        await connection.query('SET @sgifep_reset = NULL');
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error('Error en limpieza:', err.message);
    }
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Facturas pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
