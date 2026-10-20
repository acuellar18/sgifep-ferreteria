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

function casiIgual(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

function tokenConRoles(roles) {
  return jwt.sign(
    { sub: 1, username: `prueba_${roles[0]}`, nombre: 'Prueba', roles, superadmin: false },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(ruta, roles = ['administrador']) {
    const headers = roles === null ? {} : { Authorization: `Bearer ${tokenConRoles(roles)}` };
    const res = await fetch(`${base}${ruta}`, { headers });
    let body = null;
    try { body = await res.json(); } catch { /* respuesta sin JSON */ }
    return { status: res.status, body };
  }

  try {
    for (const rol of ['administrador', 'compras', 'bodega']) {
      const res = await api('/api/reportes-inventario/resumen', [rol]);
      check(`${rol} puede consultar el reporte`, res.status === 200, `status ${res.status}`);
    }

    for (const rol of ['caja', 'ventas', 'reparto']) {
      const res = await api('/api/reportes-inventario/resumen', [rol]);
      check(`${rol} no puede consultar el reporte`, res.status === 403, `status ${res.status}`);
    }

    const sinToken = await api('/api/reportes-inventario/resumen', null);
    check('sin token el reporte responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    const resumen = await api('/api/reportes-inventario/resumen');
    const datos = resumen.body?.data;
    check('el reporte responde 200', resumen.status === 200 && Boolean(datos), `status ${resumen.status}`);
    check('incluye los totales', Boolean(datos?.totales), JSON.stringify(datos?.totales));
    check('incluye el desglose por categoría', Array.isArray(datos?.categorias));
    check('incluye stock bajo', Array.isArray(datos?.stock_bajo));
    check('incluye productos sin movimiento', Array.isArray(datos?.sin_movimiento));
    check('indica los días sin movimiento', Number(datos?.dias_sin_movimiento) > 0, String(datos?.dias_sin_movimiento));
    check('incluye fecha de generación', Boolean(datos?.generado_en));
    check(
      'la suma de categorías coincide con el total',
      casiIgual(
        datos.categorias.reduce((s, c) => s + Number(c.productos), 0),
        datos.totales.productos
      ),
      `categorias=${datos.categorias.reduce((s, c) => s + Number(c.productos), 0)} total=${datos.totales.productos}`
    );
    check(
      'la suma de unidades coincide con el total',
      casiIgual(
        datos.categorias.reduce((s, c) => s + Number(c.unidades), 0),
        datos.totales.unidades
      ),
      `categorias=${datos.categorias.reduce((s, c) => s + Number(c.unidades), 0)} total=${datos.totales.unidades}`
    );
    check(
      'la suma de valores coincide con el total',
      casiIgual(
        datos.categorias.reduce((s, c) => s + Number(c.valor), 0),
        datos.totales.valor
      ),
      `categorias=${datos.categorias.reduce((s, c) => s + Number(c.valor), 0)} total=${datos.totales.valor}`
    );
    check(
      'el stock bajo respeta el límite de la consulta',
      datos.stock_bajo.length <= 200,
      `filas=${datos.stock_bajo.length}`
    );
    check(
      'sin movimiento respeta el límite de la consulta',
      datos.sin_movimiento.length <= 200,
      `filas=${datos.sin_movimiento.length}`
    );

    const categoria = datos.categorias.find((item) => Number(item.productos) > 0);
    check('existe una categoría con productos para probar el filtro', Boolean(categoria));
    if (categoria) {
      const filtrado = await api(`/api/reportes-inventario/resumen?categoria=${categoria.id}`);
      const parcial = filtrado.body?.data;
      check(
        `el filtro por categoría ${categoria.nombre} responde 200`,
        filtrado.status === 200,
        `status ${filtrado.status}`
      );
      check(
        'el filtro devuelve solo la categoría solicitada',
        parcial?.categorias?.length === 1 && String(parcial.categorias[0].id) === String(categoria.id),
        JSON.stringify(parcial?.categorias)
      );
      check(
        'el total de productos del filtro coincide con la categoría',
        casiIgual(parcial?.totales?.productos, categoria.productos),
        `total=${parcial?.totales?.productos} categoria=${categoria.productos}`
      );
    }

    const invalido = await api('/api/reportes-inventario/resumen?categoria=abc');
    check('una categoría inválida responde 400', invalido.status === 400, `status ${invalido.status}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de reportes de Inventario pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
