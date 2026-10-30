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

function token(usuarioId, roles, superadmin = false) {
  return jwt.sign(
    { sub: usuarioId, username: `prueba_caja_${usuarioId}`, nombre: 'Prueba Caja', roles, superadmin },
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
  const facturaIds = [];

  async function api(ruta, tokenJwt, metodo = 'GET', body) {
    const res = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${tokenJwt}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* sin JSON */ }
    return { status: res.status, body: json };
  }

  try {
    const [usuarios] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, 'caja', 1)`,
      [
        'Caja',
        'Prueba',
        `CAJ-${sufijo}`,
        `caja_prueba_${sufijo}`,
        bcrypt.hashSync('prueba123', 4)
      ]
    );
    usuarioId = usuarios.insertId;

    const tokenCaja = token(usuarioId, ['caja']);
    const tokenVentas = token(usuarioId, ['ventas']);
    const tokenBodega = token(usuarioId, ['bodega']);
    const tokenAdmin = token(usuarioId, ['administrador']);

    console.log('\n--- Permisos ---');
    const sinToken = await fetch(`${base}/api/caja`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    const bodega = await api('/api/caja', tokenBodega);
    check('bodega no consulta caja', bodega.status === 403, `status ${bodega.status}`);

    const ventasConsulta = await api('/api/caja', tokenVentas);
    check('ventas consulta caja', ventasConsulta.status === 200, `status ${ventasConsulta.status}`);

    const ventasAbrir = await api('/api/caja/abrir', tokenVentas, 'POST', { monto_inicial: 50 });
    check('ventas no abre caja', ventasAbrir.status === 403, `status ${ventasAbrir.status}`);

    const adminConsulta = await api('/api/caja', tokenAdmin);
    check('administrador consulta caja', adminConsulta.status === 200, `status ${adminConsulta.status}`);

    console.log('\n--- Apertura y cierre ---');
    const inicial = await api('/api/caja', tokenCaja);
    check('inicia sin caja abierta', inicial.status === 200 && inicial.body?.data?.actual === null, JSON.stringify(inicial.body));

    const abrir = await api('/api/caja/abrir', tokenCaja, 'POST', { monto_inicial: 100 });
    check('abre caja', abrir.status === 201 && abrir.body?.data?.actual?.estado === 'abierta', JSON.stringify(abrir.body));
    check('monto inicial guardado', Number(abrir.body?.data?.actual?.monto_inicial) === 100, JSON.stringify(abrir.body));

    const duplicada = await api('/api/caja/abrir', tokenCaja, 'POST', { monto_inicial: 100 });
    check('no permite dos cajas abiertas', duplicada.status === 409, `status ${duplicada.status}`);

    const [clientes] = await db.query("SELECT id, nombre, nit FROM clientes WHERE nit = 'CF' LIMIT 1");
    const cliente = clientes[0];
    check('existe cliente CF', Boolean(cliente), 'No se encontró el cliente CF');

    if (cliente) {
      const [contado] = await db.query(
        `INSERT INTO facturas
           (numero, cliente_id, cliente_nombre, cliente_nit, fecha, condicion,
            subtotal, iva, total, monto_pagado, saldo_pendiente, estado, estado_pago, usuario_id)
         VALUES (?, ?, ?, ?, CURDATE(), 'contado', 50, 0, 50, 50, 0, 'emitida', 'pagada', ?)`,
        [`TEST-CAJA-${sufijo}-1`, cliente.id, cliente.nombre, cliente.nit, usuarioId]
      );
      facturaIds.push(contado.insertId);

      const [credito] = await db.query(
        `INSERT INTO facturas
           (numero, cliente_id, cliente_nombre, cliente_nit, fecha, condicion,
            subtotal, iva, total, monto_pagado, saldo_pendiente, estado, estado_pago, usuario_id)
         VALUES (?, ?, ?, ?, CURDATE(), 'credito', 30, 0, 30, 0, 30, 'emitida', 'pendiente', ?)`,
        [`TEST-CAJA-${sufijo}-2`, cliente.id, cliente.nombre, cliente.nit, usuarioId]
      );
      facturaIds.push(credito.insertId);
    }

    const conVentas = await api('/api/caja', tokenCaja);
    const actual = conVentas.body?.data?.actual;
    check('calcula ventas del turno', Number(actual?.ventas_total) === 50, JSON.stringify(actual));
    check('excluye credito del turno', Number(actual?.ventas_count) === 1, JSON.stringify(actual));
    check('calcula solo efectivo de contado', Number(actual?.ventas_efectivo) === 50, JSON.stringify(actual));
    check('calcula efectivo esperado', Number(actual?.efectivo_esperado) === 150, JSON.stringify(actual));

    const cerrar = await api('/api/caja/cerrar', tokenCaja, 'POST', {
      denominaciones: { 100: 1, 50: 1, 10: 1 },
      monto_contado_tarjeta: 0,
      monto_contado_transferencia: 0,
      observaciones: 'Prueba automatizada'
    });
    check('cierra caja', cerrar.status === 200 && cerrar.body?.data?.actual === null, JSON.stringify(cerrar.body));
    const historial = cerrar.body?.data?.historial || [];
    const sesion = historial[0];
    check('historial registra cierre', sesion?.estado === 'cerrada', JSON.stringify(sesion));
    check('historial guarda ventas', Number(sesion?.ventas_total) === 50, JSON.stringify(sesion));
    check('historial guarda contado', Number(sesion?.monto_contado) === 160, JSON.stringify(sesion));
    check('historial guarda diferencia', Number(sesion?.diferencia) === 10, JSON.stringify(sesion));
    check(
      'historial guarda arqueo por denominaciones',
      Array.isArray(sesion?.arqueo_detalle) && sesion.arqueo_detalle.length === 12,
      JSON.stringify(sesion?.arqueo_detalle)
    );
    check(
      'historial guarda montos contados de tarjeta y transferencia',
      Number(sesion?.monto_contado_tarjeta) === 0 && Number(sesion?.monto_contado_transferencia) === 0,
      JSON.stringify(sesion)
    );

    const cerrarSinCaja = await api('/api/caja/cerrar', tokenCaja, 'POST', { monto_contado: 10 });
    check('no cierra sin caja abierta', cerrarSinCaja.status === 409, `status ${cerrarSinCaja.status}`);

    console.log('\n--- Validaciones ---');
    const abrirNegativo = await api('/api/caja/abrir', tokenCaja, 'POST', { monto_inicial: -1 });
    check('rechaza monto inicial negativo', abrirNegativo.status === 400, `status ${abrirNegativo.status}`);
  } finally {
    if (facturaIds.length) {
      await db.query(`DELETE FROM facturas WHERE id IN (${facturaIds.map(() => '?').join(', ')})`, facturaIds);
    }
    if (usuarioId) {
      await db.query('DELETE FROM sesiones_caja WHERE usuario_id = ?', [usuarioId]);
      await db.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
    }
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) de caja fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de caja pasaron.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
