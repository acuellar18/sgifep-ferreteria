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

function casiIgual(a, b, margen = 0.001) {
  return Math.abs(Number(a) - Number(b)) <= margen;
}

function token(roles) {
  return jwt.sign(
    { sub: 1, username: `prueba_${roles[0]}`, nombre: 'Prueba', roles, superadmin: false },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );
}

async function probarPermisos(base) {
  const roles = ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto'];
  const tokens = Object.fromEntries(roles.map((rol) => [rol, token([rol])]));

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
    try { json = await res.json(); } catch { /* respuesta sin JSON */ }
    return { status: res.status, body: json };
  }

  for (const rol of roles) {
    const r = await api('/api/productos', rol);
    check(`productos visible para ${rol}`, r.status === 200, `status ${r.status}`);
    const producto = r.body?.data?.[0];
    const conCostos = rol === 'administrador' || rol === 'compras' || rol === 'bodega';
    check(
      `costos ${conCostos ? 'visibles' : 'ocultos'} para ${rol}`,
      Boolean(producto) && ('costo_promedio' in producto) === conCostos,
      JSON.stringify(producto)
    );

    const categorias = await api('/api/productos/categorias', rol);
    check(`categorías visibles para ${rol}`, categorias.status === 200, `status ${categorias.status}`);
  }

  for (const rol of ['administrador', 'compras', 'bodega']) {
    const r = await api('/api/productos', rol, 'POST', {});
    check(`crear producto habilitado para ${rol}`, r.status !== 401 && r.status !== 403, `status ${r.status}`);
    const reporte = await api('/api/reportes-inventario/resumen', rol);
    check(`reporte de inventario visible para ${rol}`, reporte.status === 200, `status ${reporte.status}`);
  }

  for (const rol of ['caja', 'ventas', 'reparto']) {
    const r = await api('/api/productos', rol, 'POST', {});
    check(`crear producto denegado para ${rol}`, r.status === 403, `status ${r.status}`);
    const reporte = await api('/api/reportes-inventario/resumen', rol);
    check(`reporte de inventario denegado para ${rol}`, reporte.status === 403, `status ${reporte.status}`);
  }

  for (const rol of ['compras', 'bodega']) {
    const r = await api('/api/productos/999999', rol, 'DELETE');
    check(`eliminar producto denegado para ${rol}`, r.status === 403, `status ${r.status}`);
  }
  const eliminarAdmin = await api('/api/productos/999999', 'administrador', 'DELETE');
  check('eliminar producto habilitado para administrador', eliminarAdmin.status === 404, `status ${eliminarAdmin.status}`);
}

async function probarEsquemaYStock() {
  const conn = await db.pool.getConnection();
  const codigo = `PRUEBA-INV-${Date.now()}`;
  let productoId = null;

  try {
    const [permisos] = await conn.query('SELECT COUNT(*) AS total FROM permisos WHERE modulo = ?', ['inventario']);
    check('existen los permisos de Inventario', Number(permisos[0]?.total) === 13, String(permisos[0]?.total));

    const [asignaciones] = await conn.query('SELECT COUNT(*) AS total FROM permisos_rol');
    check('hay permisos asignados a roles', Number(asignaciones[0]?.total) > 0, String(asignaciones[0]?.total));

    const [columnasProducto] = await conn.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'
         AND COLUMN_NAME IN ('codigo_barras','tipo','imagen','imagen_miniatura','imagen_mime')`
    );
    check('productos tiene las columnas nuevas', columnasProducto.length === 5, String(columnasProducto.length));

    const [columnasMovimiento] = await conn.query(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'movimientos_inventario'
         AND COLUMN_NAME IN ('saldo_resultante','motivo')`
    );
    check('movimientos tiene saldo_resultante y motivo', columnasMovimiento.length === 2, String(columnasMovimiento.length));

    const [triggers] = await conn.query(
      `SELECT TRIGGER_NAME
       FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'movimientos_inventario'`
    );
    const nombresTriggers = triggers.map((t) => t.TRIGGER_NAME);
    check('existe trg_movimientos_before_insert', nombresTriggers.includes('trg_movimientos_before_insert'));
    check('no existe el trigger antiguo after_insert', !nombresTriggers.includes('trg_movimientos_after_insert'));

    const [saldosNulos] = await conn.query(
      'SELECT COUNT(*) AS total FROM movimientos_inventario WHERE saldo_resultante IS NULL'
    );
    check('todos los movimientos tienen saldo_resultante', Number(saldosNulos[0]?.total) === 0, String(saldosNulos[0]?.total));

    await conn.query('SET @sgifep_reset = 1');
    await conn.query('DELETE FROM movimientos_inventario WHERE producto_id IN (SELECT id FROM productos WHERE codigo = ?)', [codigo]);
    await conn.query('DELETE FROM productos WHERE codigo = ?', [codigo]);
    await conn.query('SET @sgifep_reset = NULL');

    const [producto] = await conn.query(
      `INSERT INTO productos (codigo, nombre, tipo, unidad_medida, stock_minimo, precio_venta, activo)
       VALUES (?, 'Producto de prueba de inventario', 'producto', 'UNI', 0, 0, 1)`,
      [codigo]
    );
    productoId = producto.insertId;

    async function insertarMovimiento(datos) {
      const [resultado] = await conn.query(
        `INSERT INTO movimientos_inventario
           (producto_id, tipo, origen, referencia_tipo, referencia_id, cantidad,
            costo_unitario, notas, motivo, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          productoId,
          datos.tipo,
          datos.origen,
          datos.referencia_tipo || null,
          datos.referencia_id || null,
          datos.cantidad,
          datos.costo_unitario || 0,
          datos.notas || null,
          datos.motivo || null
        ]
      );
      const [movimiento] = await conn.query(
        'SELECT saldo_resultante FROM movimientos_inventario WHERE id = ?',
        [resultado.insertId]
      );
      const [estado] = await conn.query(
        'SELECT stock_actual, costo_promedio, costo_ultimo FROM productos WHERE id = ?',
        [productoId]
      );
      return { movimiento: movimiento[0], producto: estado[0] };
    }

    const inicial = await insertarMovimiento({
      tipo: 'entrada',
      origen: 'inventario_inicial',
      cantidad: 10,
      costo_unitario: 10,
      motivo: 'Carga inicial de prueba'
    });
    check('inventario inicial deja stock 10', casiIgual(inicial.producto.stock_actual, 10), JSON.stringify(inicial));
    check('inventario inicial fija costo promedio 10', casiIgual(inicial.producto.costo_promedio, 10), JSON.stringify(inicial));
    check('inventario inicial fija costo último 10', casiIgual(inicial.producto.costo_ultimo, 10), JSON.stringify(inicial));
    check('inventario inicial guarda saldo 10', casiIgual(inicial.movimiento.saldo_resultante, 10), JSON.stringify(inicial));

    const compra = await insertarMovimiento({
      tipo: 'entrada',
      origen: 'compra',
      referencia_tipo: 'compras',
      referencia_id: 999999,
      cantidad: 10,
      costo_unitario: 20
    });
    check('compra deja stock 20', casiIgual(compra.producto.stock_actual, 20), JSON.stringify(compra));
    check('compra recalcula promedio a 15', casiIgual(compra.producto.costo_promedio, 15), JSON.stringify(compra));
    check('compra actualiza costo último a 20', casiIgual(compra.producto.costo_ultimo, 20), JSON.stringify(compra));
    check('compra guarda saldo 20', casiIgual(compra.movimiento.saldo_resultante, 20), JSON.stringify(compra));

    const ajustePositivo = await insertarMovimiento({
      tipo: 'entrada',
      origen: 'ajuste_positivo',
      cantidad: 5,
      costo_unitario: 99,
      motivo: 'Ajuste positivo de prueba'
    });
    check('ajuste positivo deja stock 25', casiIgual(ajustePositivo.producto.stock_actual, 25), JSON.stringify(ajustePositivo));
    check('ajuste positivo no cambia el promedio', casiIgual(ajustePositivo.producto.costo_promedio, 15), JSON.stringify(ajustePositivo));
    check('ajuste positivo no cambia el costo último', casiIgual(ajustePositivo.producto.costo_ultimo, 20), JSON.stringify(ajustePositivo));

    const ajusteNegativo = await insertarMovimiento({
      tipo: 'salida',
      origen: 'ajuste_negativo',
      cantidad: 2,
      motivo: 'Ajuste negativo de prueba'
    });
    check('ajuste negativo deja stock 23', casiIgual(ajusteNegativo.producto.stock_actual, 23), JSON.stringify(ajusteNegativo));
    check('ajuste negativo no cambia el promedio', casiIgual(ajusteNegativo.producto.costo_promedio, 15), JSON.stringify(ajusteNegativo));

    const anulacion = await insertarMovimiento({
      tipo: 'salida',
      origen: 'anulacion_compra',
      referencia_tipo: 'compras',
      referencia_id: 999999,
      cantidad: 10,
      costo_unitario: 20
    });
    check('anulación de compra deja stock 13', casiIgual(anulacion.producto.stock_actual, 13), JSON.stringify(anulacion));
    check(
      'anulación recalcula el costo promedio',
      casiIgual(anulacion.producto.costo_promedio, 11.1538),
      JSON.stringify(anulacion)
    );
    check('anulación recalcula el costo último a 0', casiIgual(anulacion.producto.costo_ultimo, 0), JSON.stringify(anulacion));
    check('anulación guarda saldo 13', casiIgual(anulacion.movimiento.saldo_resultante, 13), JSON.stringify(anulacion));

    let salidaInsuficiente = false;
    try {
      await insertarMovimiento({
        tipo: 'salida',
        origen: 'ajuste_negativo',
        cantidad: 999,
        motivo: 'Salida inválida de prueba'
      });
    } catch {
      salidaInsuficiente = true;
    }
    const [sinCambio] = await conn.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('rechaza salidas con stock insuficiente', salidaInsuficiente);
    check('la salida rechazada no altera el stock', casiIgual(sinCambio[0]?.stock_actual, 13), JSON.stringify(sinCambio[0]));

    let ajusteSinMotivo = false;
    try {
      await insertarMovimiento({
        tipo: 'entrada',
        origen: 'ajuste_positivo',
        cantidad: 1,
        costo_unitario: 15
      });
    } catch {
      ajusteSinMotivo = true;
    }
    check('rechaza ajustes sin motivo', ajusteSinMotivo);

    let updateBloqueado = false;
    try {
      await conn.query('UPDATE movimientos_inventario SET cantidad = cantidad WHERE producto_id = ?', [productoId]);
    } catch {
      updateBloqueado = true;
    }
    check('bloquea la modificación de movimientos', updateBloqueado);

    let deleteBloqueado = false;
    try {
      await conn.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [productoId]);
    } catch {
      deleteBloqueado = true;
    }
    check('bloquea la eliminación de movimientos', deleteBloqueado);
  } finally {
    try {
      await conn.query('SET @sgifep_reset = 1');
      if (productoId) {
        await conn.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [productoId]);
        await conn.query('DELETE FROM productos WHERE id = ?', [productoId]);
      }
      await conn.query('SET @sgifep_reset = NULL');
    } catch (error) {
      console.error('No se pudo limpiar el producto de prueba:', error.message);
    }
    conn.release();
  }
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await probarPermisos(base);
    await probarEsquemaYStock();
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Inventario Fase 2 pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
