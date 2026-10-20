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

async function main() {
  const token = jwt.sign(
    { sub: 1, username: 'prueba_reportes', nombre: 'Prueba', roles: ['administrador'], superadmin: false },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(ruta) {
    const res = await fetch(`${base}${ruta}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let body = null;
    try { body = await res.json(); } catch { /* respuesta sin JSON */ }
    return { status: res.status, body };
  }

  async function datos(ruta) {
    const res = await api(ruta);
    check(`GET ${ruta}`, res.status === 200, `status ${res.status}`);
    return res.body?.data;
  }

  try {
    const resumen = await datos('/api/reportes-compras/resumen');
    const meses = await datos('/api/reportes-compras/compras-por-mes');
    const cuentas = await datos('/api/reportes-compras/cuentas-por-pagar');
    const productos = await datos('/api/reportes-compras/productos-mas-comprados?limite=10');
    const proveedores = await datos('/api/proveedores/resumen?estado=activo');
    const categorias = await datos('/api/reportes-compras/categorias');

    check('resumen tiene compras', resumen.num_compras > 0, `num_compras=${resumen.num_compras}`);
    check(
      'compras por mes suma el total de compras',
      meses.reduce((s, m) => s + Number(m.cantidad), 0) === Number(resumen.num_compras),
      `meses=${meses.reduce((s, m) => s + Number(m.cantidad), 0)} resumen=${resumen.num_compras}`
    );
    check(
      'compras por mes suma el monto comprado',
      casiIgual(meses.reduce((s, m) => s + Number(m.total), 0), resumen.total_comprado),
      `meses=${meses.reduce((s, m) => s + Number(m.total), 0)} resumen=${resumen.total_comprado}`
    );
    check(
      'cuentas por pagar suma el saldo pendiente',
      casiIgual(cuentas.reduce((s, c) => s + Number(c.saldo_pendiente), 0), resumen.total_por_pagar),
      `cuentas=${cuentas.reduce((s, c) => s + Number(c.saldo_pendiente), 0)} resumen=${resumen.total_por_pagar}`
    );

    let proveedorConCompras = null;
    for (const proveedor of proveedores) {
      const top = await datos(`/api/reportes-compras/top-proveedores?proveedor=${proveedor.id}`);
      if (top.length > 0) {
        proveedorConCompras = proveedor;
        check(
          `top proveedores respeta el filtro ${proveedor.nombre}`,
          top.every((p) => String(p.id) === String(proveedor.id)),
          JSON.stringify(top)
        );
        break;
      }
    }
    check('existe un proveedor con compras para probar el filtro', Boolean(proveedorConCompras));

    let categoriaConCompras = null;
    for (const categoria of categorias) {
      const parcial = await datos(`/api/reportes-compras/resumen?categoria=${categoria.id}`);
      if (parcial.num_compras > 0) {
        categoriaConCompras = categoria;
        const parcialMeses = await datos(`/api/reportes-compras/compras-por-mes?categoria=${categoria.id}`);
        check(
          `filtro categoría ${categoria.nombre} es consistente`,
          parcialMeses.reduce((s, m) => s + Number(m.cantidad), 0) === Number(parcial.num_compras) &&
            casiIgual(parcialMeses.reduce((s, m) => s + Number(m.total), 0), parcial.total_comprado),
          `num_compras=${parcial.num_compras}`
        );
        break;
      }
    }
    check('existe una categoría con compras para probar el filtro', Boolean(categoriaConCompras));

    if (productos.length) {
      const variacion = await datos(`/api/reportes-compras/variacion-costo/${productos[0].id}`);
      check('variación de costo devuelve filas', Array.isArray(variacion), typeof variacion);
    }

    const compras = await datos('/api/compras?page=1&pageSize=100&estado=recibida');
    const lista = Array.isArray(compras) ? compras : compras?.data;
    if (Array.isArray(lista) && lista.length) {
      const fechas = lista.map((c) => String(c.fecha).slice(0, 10)).sort();
      const desde = fechas[0];
      const hasta = fechas[fechas.length - 1];
      const porFecha = await datos(`/api/reportes-compras/resumen?startDate=${desde}&endDate=${hasta}`);
      const mesesFecha = await datos(`/api/reportes-compras/compras-por-mes?startDate=${desde}&endDate=${hasta}`);
      check(
        'filtro de fechas es consistente',
        mesesFecha.reduce((s, m) => s + Number(m.cantidad), 0) === Number(porFecha.num_compras) &&
          casiIgual(mesesFecha.reduce((s, m) => s + Number(m.total), 0), porFecha.total_comprado),
        `${desde} a ${hasta}`
      );
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de reportes de Compras pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
