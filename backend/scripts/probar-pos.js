const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

function crearToken(usuarioId, roles, superadmin = false) {
  return jwt.sign(
    {
      sub: usuarioId,
      username: `pos_prueba_${usuarioId}`,
      nombre: 'POS Prueba',
      roles,
      superadmin
    },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sufijo = Date.now();
  let usuarioId = null;
  let cajaId = null;
  let productoId = null;
  const ventaIds = [];
  const facturaIds = [];
  const devolucionIds = [];

  async function api(ruta, token, metodo = 'GET', body) {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try {
      json = await respuesta.json();
    } catch {
      json = null;
    }
    return { status: respuesta.status, body: json };
  }

  try {
    const [usuarios] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, activo)
       VALUES ('POS', 'Prueba', ?, ?, ?, 'caja', 1)`,
      [`POS-${sufijo}`, `pos_prueba_${sufijo}`, bcrypt.hashSync('prueba123', 4)]
    );
    usuarioId = usuarios.insertId;

    const tokenCaja = crearToken(usuarioId, ['caja']);
    const tokenVentas = crearToken(usuarioId, ['ventas']);
    const tokenBodega = crearToken(usuarioId, ['bodega']);
    const tokenAdmin = crearToken(usuarioId, ['administrador'], true);

    const creado = await api('/api/productos', tokenAdmin, 'POST', {
      codigo: `POS-${sufijo}`,
      codigo_barras: `750${sufijo}`,
      nombre: 'Producto de prueba POS',
      tipo: 'producto',
      unidad_medida: 'UNI',
      precio_venta: 10,
      stock_inicial: 20,
      costo_inicial: 5,
      activo: true
    });
    check('crea producto de prueba', creado.status === 201, JSON.stringify(creado.body));
    productoId = creado.body?.data?.id;

    const [productos] = await db.query(
      'SELECT id, codigo, codigo_barras, nombre, stock_actual, precio_venta FROM productos WHERE id = ?',
      [productoId]
    );
    const producto = productos[0];
    const stockInicial = Number(producto.stock_actual);
    check('stock inicial 20', stockInicial === 20, `${stockInicial}`);

    const inicio = await api('/api/pos/contexto', tokenCaja);
    check(
      'contexto sin caja',
      inicio.status === 200 && inicio.body?.data?.caja === null,
      JSON.stringify(inicio.body)
    );
    check(
      'contexto trae consumidor final',
      inicio.body?.data?.cliente_predeterminado?.nit === 'CF'
    );
    check('bodega no consulta POS', (await api('/api/pos/contexto', tokenBodega)).status === 403);
    check('ventas consulta POS', (await api('/api/pos/contexto', tokenVentas)).status === 200);

    const sinCaja = await api('/api/pos/ventas', tokenCaja, 'POST', {
      cliente: { nit: 'CF', nombre: 'Consumidor Final' },
      metodo_pago: 'efectivo',
      monto_recibido: 1000,
      detalles: [{ producto_id: producto.id, cantidad: 1 }]
    });
    check('no vende sin caja', sinCaja.status === 409, `status ${sinCaja.status}`);

    const apertura = await api('/api/caja/abrir', tokenCaja, 'POST', { monto_inicial: 100 });
    check('abre caja', apertura.status === 201, JSON.stringify(apertura.body));
    cajaId = apertura.body?.data?.actual?.id;

    const resumenAntes = await api('/api/pos/resumen', tokenCaja);
    const ventasPrevias = Number(resumenAntes.body?.data?.ventas_count) || 0;

    const buscar = await api(
      `/api/pos/productos/codigo?codigo=${encodeURIComponent(producto.codigo_barras || producto.codigo)}`,
      tokenCaja
    );
    check(
      'busca producto por código',
      buscar.status === 200 && buscar.body?.data?.id === producto.id,
      JSON.stringify(buscar.body)
    );

    const precio = Number(producto.precio_venta);
    const venta = await api('/api/pos/ventas', tokenCaja, 'POST', {
      cliente: { nit: 'CF', nombre: 'Consumidor Final' },
      metodo_pago: 'efectivo',
      monto_recibido: 1000,
      detalles: [{ producto_id: producto.id, cantidad: 2, descuento: 1 }]
    });
    check('crea venta efectivo', venta.status === 201, JSON.stringify(venta.body));
    const ventaEfectivo = venta.body?.data?.venta;
    if (ventaEfectivo) {
      ventaIds.push(ventaEfectivo.id);
      facturaIds.push(ventaEfectivo.factura_id);
      const totalEsperado = Math.round((precio * 2 - 1) * 100) / 100;
      check(
        'total con descuento',
        Number(ventaEfectivo.total) === totalEsperado,
        `${ventaEfectivo.total} vs ${totalEsperado}`
      );
      check(
        'subtotal + iva = total',
        Math.round((Number(ventaEfectivo.subtotal) + Number(ventaEfectivo.iva)) * 100) / 100 ===
          Number(ventaEfectivo.total)
      );
      check(
        'iva incluido 12%',
        Number(ventaEfectivo.iva) ===
          Math.round((Number(ventaEfectivo.total) - Number(ventaEfectivo.total) / 1.12) * 100) / 100,
        `${ventaEfectivo.iva}`
      );
      check(
        'factura contado pagada',
        Boolean(ventaEfectivo.factura_numero) && ventaEfectivo.estado === 'completada'
      );
      check(
        'cambio calculado',
        Number(ventaEfectivo.cambio) === Math.round((1000 - totalEsperado) * 100) / 100,
        `${ventaEfectivo.cambio}`
      );
    }

    const [stockRows] = await db.query('SELECT stock_actual FROM productos WHERE id = ?', [
      producto.id
    ]);
    check(
      'descuenta stock',
      Number(stockRows[0].stock_actual) === stockInicial - 2,
      `${stockRows[0].stock_actual}`
    );

    const resumen = await api('/api/pos/resumen', tokenCaja);
    check(
      'resumen del día',
      Number(resumen.body?.data?.ventas_count) === ventasPrevias + 1,
      JSON.stringify(resumen.body)
    );

    const caja = await api('/api/caja', tokenCaja);
    const actual = caja.body?.data?.actual;
    check(
      'caja suma efectivo',
      Number(actual?.ventas_efectivo) === Number(ventaEfectivo?.total),
      JSON.stringify(actual)
    );
    check(
      'caja suma total',
      Number(actual?.ventas_total) === Number(ventaEfectivo?.total),
      JSON.stringify(actual)
    );
    check('caja tarjeta 0', Number(actual?.ventas_tarjeta) === 0, JSON.stringify(actual));

    const tarjeta = await api('/api/pos/ventas', tokenVentas, 'POST', {
      cliente: { nit: 'CF', nombre: 'Consumidor Final' },
      metodo_pago: 'tarjeta',
      referencia: 'AUTH-123',
      detalles: [{ producto_id: producto.id, cantidad: 1 }]
    });
    check('ventas registra con tarjeta', tarjeta.status === 201, JSON.stringify(tarjeta.body));
    const ventaTarjeta = tarjeta.body?.data?.venta;
    if (ventaTarjeta) {
      ventaIds.push(ventaTarjeta.id);
      facturaIds.push(ventaTarjeta.factura_id);
    }

    const sinReferencia = await api('/api/pos/ventas', tokenCaja, 'POST', {
      cliente: { nit: 'CF', nombre: 'Consumidor Final' },
      metodo_pago: 'transferencia',
      detalles: [{ producto_id: producto.id, cantidad: 1 }]
    });
    check(
      'transferencia exige referencia',
      sinReferencia.status === 400,
      `status ${sinReferencia.status}`
    );

    const transferencia = await api('/api/pos/ventas', tokenCaja, 'POST', {
      cliente: { nit: 'CF', nombre: 'Consumidor Final' },
      metodo_pago: 'transferencia',
      referencia: 'TRF-999',
      detalles: [{ producto_id: producto.id, cantidad: 1 }]
    });
    check(
      'crea venta transferencia',
      transferencia.status === 201,
      JSON.stringify(transferencia.body)
    );
    const ventaTransferencia = transferencia.body?.data?.venta;
    if (ventaTransferencia) {
      ventaIds.push(ventaTransferencia.id);
      facturaIds.push(ventaTransferencia.factura_id);
    }

    const cajaConMetodos = await api('/api/caja', tokenCaja);
    check(
      'caja suma tarjeta',
      Number(cajaConMetodos.body?.data?.actual?.ventas_tarjeta) === Number(ventaTarjeta?.total),
      JSON.stringify(cajaConMetodos.body?.data?.actual)
    );
    check(
      'caja suma transferencia',
      Number(cajaConMetodos.body?.data?.actual?.ventas_transferencia) ===
        Number(ventaTransferencia?.total),
      JSON.stringify(cajaConMetodos.body?.data?.actual)
    );

    const cuentas = await api('/api/pos/cuentas-por-cobrar', tokenCaja);
    check(
      'cuentas por cobrar responde',
      cuentas.status === 200 && Array.isArray(cuentas.body?.data?.data),
      JSON.stringify(cuentas.body)
    );

    const [clientesCf] = await db.query("SELECT id FROM clientes WHERE nit = 'CF' LIMIT 1");
    const credito = await api('/api/facturas', tokenAdmin, 'POST', {
      cliente_id: clientesCf[0]?.id,
      fecha: new Date().toISOString().slice(0, 10),
      condicion: 'credito',
      fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      detalles: [{ producto_id: producto.id, cantidad: 1, precio_unitario: precio }]
    });
    const facturaCreditoId = credito.body?.data?.id;
    if (facturaCreditoId) facturaIds.push(facturaCreditoId);
    check(
      'emite factura al crédito para POS',
      credito.status === 201 && Boolean(facturaCreditoId),
      JSON.stringify(credito.body)
    );

    const cuentaCredito = await api(
      `/api/pos/cuentas-por-cobrar/${facturaCreditoId}`,
      tokenCaja
    );
    const totalCredito = Number(cuentaCredito.body?.data?.total);
    check(
      'consulta cuenta por cobrar',
      cuentaCredito.status === 200 && Number(cuentaCredito.body?.data?.saldo_pendiente) === totalCredito,
      JSON.stringify(cuentaCredito.body)
    );

    const pagoParcial = await api(
      `/api/pos/cuentas-por-cobrar/${facturaCreditoId}/pagos`,
      tokenCaja,
      'POST',
      { monto: 4, metodo_pago: 'efectivo' }
    );
    check(
      'registra pago parcial de crédito',
      pagoParcial.status === 201 &&
        pagoParcial.body?.data?.factura?.estado_pago === 'parcial' &&
        Number(pagoParcial.body?.data?.factura?.saldo_pendiente) === totalCredito - 4,
      JSON.stringify(pagoParcial.body)
    );

    const pagoFinal = await api(
      `/api/pos/cuentas-por-cobrar/${facturaCreditoId}/pagos`,
      tokenCaja,
      'POST',
      { monto: totalCredito - 4, metodo_pago: 'tarjeta', referencia: 'POS-CREDITO' }
    );
    check(
      'registra pago final de crédito',
      pagoFinal.status === 201 &&
        pagoFinal.body?.data?.factura?.estado_pago === 'pagada' &&
        Number(pagoFinal.body?.data?.factura?.saldo_pendiente) === 0,
      JSON.stringify(pagoFinal.body)
    );

    const cajaCredito = await api('/api/caja', tokenCaja);
    const actualCredito = cajaCredito.body?.data?.actual;
    check(
      'caja suma cobros de crédito',
      Number(actualCredito?.cobros_total) === totalCredito &&
        Number(actualCredito?.cobros_efectivo) === 4 &&
        Number(actualCredito?.cobros_tarjeta) === totalCredito - 4,
      JSON.stringify(actualCredito)
    );

    const anularVentas = await api(`/api/pos/ventas/${ventaEfectivo.id}/anular`, tokenVentas, 'POST', {
      motivo: 'x'
    });
    check('ventas no anula', anularVentas.status === 403, `status ${anularVentas.status}`);

    const anular = await api(`/api/pos/ventas/${ventaEfectivo.id}/anular`, tokenAdmin, 'POST', {
      motivo: 'Prueba automática'
    });
    check(
      'admin anula venta',
      anular.status === 200 && anular.body?.data?.estado === 'anulada',
      JSON.stringify(anular.body)
    );

    const [stockAnulado] = await db.query('SELECT stock_actual FROM productos WHERE id = ?', [
      producto.id
    ]);
    check(
      'anulación devuelve stock',
      Number(stockAnulado[0].stock_actual) === stockInicial - 2,
      `${stockAnulado[0].stock_actual}`
    );

    const [facturaAnulada] = await db.query('SELECT estado FROM facturas WHERE id = ?', [
      ventaEfectivo.factura_id
    ]);
    check(
      'factura asociada anulada',
      facturaAnulada[0]?.estado === 'anulada',
      JSON.stringify(facturaAnulada)
    );

    const detalleTransferencia = await api(
      `/api/pos/ventas/${ventaTransferencia.id}`,
      tokenCaja
    );
    const lineaTransferencia = detalleTransferencia.body?.data?.detalles?.[0];
    const devolucion = await api(
      `/api/pos/ventas/${ventaTransferencia.id}/devoluciones`,
      tokenCaja,
      'POST',
      {
        tipo: 'reembolso',
        metodo_pago: 'transferencia',
        motivo: 'Prueba automática de devolución',
        detalles: [{ detalle_venta_id: lineaTransferencia?.id, cantidad: 1 }]
      }
    );
    const devolucionId = devolucion.body?.data?.id;
    if (devolucionId) devolucionIds.push(devolucionId);
    check(
      'registra devolución parcial',
      devolucion.status === 201 && Number(devolucion.body?.data?.total) === precio,
      JSON.stringify(devolucion.body)
    );

    const [stockDevuelto] = await db.query('SELECT stock_actual FROM productos WHERE id = ?', [
      producto.id
    ]);
    check(
      'devolución devuelve stock',
      Number(stockDevuelto[0].stock_actual) === stockInicial - 2,
      `${stockDevuelto[0].stock_actual}`
    );

    const cajaDevolucion = await api('/api/caja', tokenCaja);
    check(
      'caja resta devoluciones',
      Number(cajaDevolucion.body?.data?.actual?.devoluciones_total) === precio &&
        Number(cajaDevolucion.body?.data?.actual?.devoluciones_transferencia) === precio,
      JSON.stringify(cajaDevolucion.body?.data?.actual)
    );

    const historial = await api('/api/pos/ventas?page=1&pageSize=10', tokenCaja);
    check(
      'historial lista ventas',
      historial.status === 200 && historial.body?.data?.length >= 3,
      JSON.stringify(historial.body?.data?.length)
    );

    const detalle = await api(`/api/pos/ventas/${ventaEfectivo.id}`, tokenCaja);
    check(
      'detalle de venta',
      detalle.status === 200 && detalle.body?.data?.detalles?.length === 1,
      JSON.stringify(detalle.body)
    );

    const cierre = await api('/api/caja/cerrar', tokenCaja, 'POST', {
      monto_contado: 100,
      observaciones: 'Prueba POS'
    });
    check('cierra caja', cierre.status === 200, JSON.stringify(cierre.body));

    const anularCerrada = await api(
      `/api/pos/ventas/${ventaTarjeta.id}/anular`,
      tokenAdmin,
      'POST',
      { motivo: 'x' }
    );
    check(
      'no anula venta de caja cerrada',
      anularCerrada.status === 409,
      `status ${anularCerrada.status}`
    );
  } catch (error) {
    fallos += 1;
    console.error('ERROR', error);
  } finally {
    const conexion = await db.getConnection();
    try {
      await conexion.query('SET @sgifep_reset = 1');
      if (devolucionIds.length) {
        await conexion.query(
          'DELETE FROM movimientos_inventario WHERE referencia_tipo = ? AND referencia_id IN (?)',
          ['devoluciones_venta', devolucionIds]
        );
        await conexion.query('DELETE FROM detalle_devolucion_venta WHERE devolucion_id IN (?)', [
          devolucionIds
        ]);
        await conexion.query('DELETE FROM devoluciones_venta WHERE id IN (?)', [devolucionIds]);
      }
      if (ventaIds.length) {
        await conexion.query('DELETE FROM cobros WHERE venta_id IN (?)', [ventaIds]);
        await conexion.query('DELETE FROM detalle_venta WHERE venta_id IN (?)', [ventaIds]);
        await conexion.query('DELETE FROM ventas WHERE id IN (?)', [ventaIds]);
      }
      if (facturaIds.length) {
        await conexion.query('DELETE FROM cobros WHERE factura_id IN (?)', [facturaIds]);
        await conexion.query('DELETE FROM movimientos_inventario WHERE referencia_tipo = ? AND referencia_id IN (?)', ['facturas', facturaIds]);
        await conexion.query('DELETE FROM detalle_factura WHERE factura_id IN (?)', [facturaIds]);
        await conexion.query('DELETE FROM facturas WHERE id IN (?)', [facturaIds]);
      }
      if (ventaIds.length) {
        await conexion.query('DELETE FROM movimientos_inventario WHERE referencia_tipo = ? AND referencia_id IN (?)', ['ventas', ventaIds]);
      }
      if (productoId) {
        await conexion.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [productoId]);
        await conexion.query('DELETE FROM productos WHERE id = ?', [productoId]);
      }
      if (cajaId) {
        await conexion.query('DELETE FROM sesiones_caja WHERE id = ?', [cajaId]);
      }
      if (usuarioId) {
        await conexion.query('DELETE FROM sesiones_caja WHERE usuario_id = ?', [usuarioId]);
        await conexion.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
      }
    } catch (errorLimpieza) {
      console.error('Limpieza:', errorLimpieza.message);
    } finally {
      conexion.release();
    }
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) de POS fallaron.`);
    process.exitCode = 1;
  } else {
    console.log('\nTodas las pruebas de POS pasaron.');
  }
}

main();
