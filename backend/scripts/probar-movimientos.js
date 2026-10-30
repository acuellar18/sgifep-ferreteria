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

function fechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const conn = await db.pool.getConnection();
  const codigo = `PRUEBA-MOV-${Date.now()}`;
  const codigoServicio = `${codigo}-SERV`;
  let productoId = null;
  let servicioId = null;
  let usuario = null;

  try {
    const [usuarios] = await conn.query(
      'SELECT id, username, nombre FROM usuarios WHERE activo = 1 ORDER BY id LIMIT 1'
    );
    usuario = usuarios[0];
    check('hay un usuario activo para registrar movimientos', Boolean(usuario));

    function token(roles) {
      return jwt.sign(
        {
          sub: usuario.id,
          username: usuario.username,
          nombre: usuario.nombre,
          roles,
          superadmin: false
        },
        jwtConfig.secreto,
        { expiresIn: '1h' }
      );
    }

    async function api(ruta, rol, metodo = 'GET', body) {
      const res = await fetch(`${base}${ruta}`, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${token([rol])}`,
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
      let json = null;
      try { json = await res.json(); } catch { /* respuesta sin JSON */ }
      return { status: res.status, body: json };
    }

    const [producto] = await conn.query(
      `INSERT INTO productos (codigo, nombre, tipo, unidad_medida, stock_minimo, precio_venta, activo)
       VALUES (?, 'Producto de prueba de movimientos', 'producto', 'UNI', 0, 0, 1)`,
      [codigo]
    );
    productoId = producto.insertId;

    const [servicio] = await conn.query(
      `INSERT INTO productos (codigo, nombre, tipo, unidad_medida, stock_minimo, precio_venta, activo)
       VALUES (?, 'Servicio de prueba de movimientos', 'servicio', 'UNI', 0, 0, 1)`,
      [codigoServicio]
    );
    servicioId = servicio.insertId;

    const lecturaAdmin = await api('/api/movimientos-inventario?page=1&pageSize=5', 'administrador');
    check('administrador puede consultar movimientos', lecturaAdmin.status === 200, `status ${lecturaAdmin.status}`);
    check('la lista responde con data y total', Array.isArray(lecturaAdmin.body?.data) && typeof lecturaAdmin.body?.total === 'number');

    const resumen = await api('/api/movimientos-inventario/resumen', 'administrador');
    check('administrador puede consultar el resumen', resumen.status === 200, `status ${resumen.status}`);
    check('el resumen incluye entradas, salidas y ajustes',
      Boolean(resumen.body?.data?.entradas && resumen.body?.data?.salidas && resumen.body?.data?.ajustes));
    check('el resumen incluye el último movimiento', 'ultimo' in (resumen.body?.data || {}));

    const entrada = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'entrada',
      cantidad: 10,
      motivo: 'Compra',
      referencia: 'FAC-001',
      observaciones: 'Entrada de prueba'
    });
    check('registra una entrada', entrada.status === 201, `status ${entrada.status} ${JSON.stringify(entrada.body)}`);
    check('la entrada guarda stock anterior 0', casiIgual(entrada.body?.data?.stock_anterior, 0), JSON.stringify(entrada.body?.data));
    check('la entrada guarda stock nuevo 10', casiIgual(entrada.body?.data?.stock_nuevo, 10), JSON.stringify(entrada.body?.data));
    check('la entrada guarda diferencia +10', casiIgual(entrada.body?.data?.diferencia, 10), JSON.stringify(entrada.body?.data));
    check('la entrada guarda el usuario autenticado', Number(entrada.body?.data?.usuario_id) === Number(usuario.id));

    const [stockEntrada] = await conn.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('la entrada actualiza el stock del producto', casiIgual(stockEntrada[0]?.stock_actual, 10), JSON.stringify(stockEntrada[0]));

    const salida = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'salida',
      cantidad: 3,
      motivo: 'Venta',
      referencia: 'VEN-001'
    });
    check('registra una salida', salida.status === 201, `status ${salida.status} ${JSON.stringify(salida.body)}`);
    check('la salida guarda stock nuevo 7', casiIgual(salida.body?.data?.stock_nuevo, 7), JSON.stringify(salida.body?.data));
    check('la salida guarda diferencia -3', casiIgual(salida.body?.data?.diferencia, -3), JSON.stringify(salida.body?.data));

    const ajuste = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'ajuste',
      cantidad: 12,
      motivo: 'Ajuste de inventario',
      observaciones: 'Conteo físico'
    });
    check('registra un ajuste', ajuste.status === 201, `status ${ajuste.status} ${JSON.stringify(ajuste.body)}`);
    check('el ajuste guarda stock nuevo 12', casiIgual(ajuste.body?.data?.stock_nuevo, 12), JSON.stringify(ajuste.body?.data));
    check('el ajuste guarda la diferencia real +5', casiIgual(ajuste.body?.data?.diferencia, 5), JSON.stringify(ajuste.body?.data));
    check('el ajuste guarda como cantidad la diferencia', casiIgual(ajuste.body?.data?.cantidad, 5), JSON.stringify(ajuste.body?.data));

    const salidaInsuficiente = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'salida',
      cantidad: 999,
      motivo: 'Merma'
    });
    check('rechaza una salida sin stock suficiente', salidaInsuficiente.status === 409, `status ${salidaInsuficiente.status}`);

    const ajusteIgual = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'ajuste',
      cantidad: 12,
      motivo: 'Ajuste de inventario'
    });
    check('rechaza un ajuste sin diferencia', ajusteIgual.status === 409, `status ${ajusteIgual.status}`);

    const cantidadCero = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'entrada',
      cantidad: 0,
      motivo: 'Otro'
    });
    check('rechaza cantidad 0 en entrada', cantidadCero.status === 400, `status ${cantidadCero.status}`);

    const tipoInvalido = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'traslado',
      cantidad: 1,
      motivo: 'Otro'
    });
    check('rechaza un tipo inválido', tipoInvalido.status === 400, `status ${tipoInvalido.status}`);

    const motivoInvalido = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: productoId,
      tipo: 'salida',
      cantidad: 1,
      motivo: 'Compra'
    });
    check('rechaza un motivo que no corresponde al tipo', motivoInvalido.status === 400, `status ${motivoInvalido.status}`);

    const movimientoServicio = await api('/api/movimientos-inventario', 'administrador', 'POST', {
      producto_id: servicioId,
      tipo: 'entrada',
      cantidad: 1,
      motivo: 'Otro'
    });
    check('rechaza movimientos de servicios', movimientoServicio.status === 409, `status ${movimientoServicio.status}`);

    const filtroTipo = await api(
      `/api/movimientos-inventario?tipo=ajuste&q=${encodeURIComponent(codigo)}`,
      'administrador'
    );
    check('filtra por tipo', filtroTipo.status === 200 && filtroTipo.body?.data?.length === 1, JSON.stringify(filtroTipo.body));
    check('el filtro por tipo devuelve solo ajustes', filtroTipo.body?.data?.every((m) => m.tipo === 'ajuste'));

    const filtroFecha = await api(
      `/api/movimientos-inventario?fecha_desde=${fechaLocalISO()}&q=${encodeURIComponent(codigo)}`,
      'administrador'
    );
    check('filtra por fecha', filtroFecha.status === 200 && filtroFecha.body?.data?.length >= 3, `status ${filtroFecha.status} ${JSON.stringify(filtroFecha.body)}`);

    const filtroUsuario = await api(
      `/api/movimientos-inventario?usuario=${encodeURIComponent(usuario.username)}&q=${encodeURIComponent(codigo)}`,
      'administrador'
    );
    check('filtra por usuario', filtroUsuario.status === 200 && filtroUsuario.body?.data?.length >= 3, `status ${filtroUsuario.status}`);

    const orden = await api(
      `/api/movimientos-inventario?q=${encodeURIComponent(codigo)}&sortBy=cantidad&sortDir=desc&pageSize=2`,
      'administrador'
    );
    check('ordena por cantidad descendente',
      orden.status === 200 &&
        Number(orden.body?.data?.[0]?.cantidad) >= Number(orden.body?.data?.[1]?.cantidad) &&
        Number(orden.body?.data?.[0]?.cantidad) === 10,
      JSON.stringify(orden.body?.data));
    check('respeta el tamaño de página', orden.body?.data?.length === 2, JSON.stringify(orden.body?.data));

    const lecturaCompras = await api('/api/movimientos-inventario', 'compras');
    check('compras puede consultar movimientos', lecturaCompras.status === 200, `status ${lecturaCompras.status}`);
    const escrituraCompras = await api('/api/movimientos-inventario', 'compras', 'POST', {
      producto_id: productoId,
      tipo: 'entrada',
      cantidad: 1,
      motivo: 'Otro'
    });
    check('compras no puede registrar movimientos', escrituraCompras.status === 403, `status ${escrituraCompras.status}`);

    const lecturaCaja = await api('/api/movimientos-inventario', 'caja');
    check('caja no puede consultar movimientos', lecturaCaja.status === 403, `status ${lecturaCaja.status}`);

    const escrituraBodega = await api('/api/movimientos-inventario', 'bodega', 'POST', {
      producto_id: productoId,
      tipo: 'entrada',
      cantidad: 1,
      motivo: 'Otro'
    });
    check('bodega puede registrar movimientos', escrituraBodega.status === 201, `status ${escrituraBodega.status}`);

    const [stockFinal] = await conn.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
    check('el stock final coincide con los movimientos', casiIgual(stockFinal[0]?.stock_actual, 13), JSON.stringify(stockFinal[0]));
  } finally {
    try {
      await conn.query('SET @sgifep_reset = 1');
      if (productoId) {
        await conn.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [productoId]);
        await conn.query('DELETE FROM productos WHERE id = ?', [productoId]);
      }
      if (servicioId) {
        await conn.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [servicioId]);
        await conn.query('DELETE FROM productos WHERE id = ?', [servicioId]);
      }
      await conn.query('SET @sgifep_reset = NULL');
    } catch (error) {
      console.error('No se pudo limpiar la prueba:', error.message);
    }
    conn.release();
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Movimientos de Inventario pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
