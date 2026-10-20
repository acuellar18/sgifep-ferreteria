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

function token(roles, id = 1, superadmin = false) {
  return jwt.sign(
    { sub: id, username: `prueba_${roles[0]}`, nombre: 'Prueba', roles, superadmin },
    jwtConfig.secreto,
    { expiresIn: '1h' }
  );
}

const TOKENS = {
  administrador: token(['administrador']),
  compras: token(['compras']),
  bodega: token(['bodega']),
  caja: token(['caja'], 10),
  ventas: token(['ventas']),
  reparto: token(['reparto'])
};

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(ruta, { rol = 'administrador', metodo = 'GET', body } = {}) {
    const res = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${TOKENS[rol]}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch { /* respuesta sin JSON */ }
    return { status: res.status, body: json };
  }

  try {
    const lectura = [
      ['/api/compras', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/compras/resumenes', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/compras/1/impresion', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/compras/impresion/lista', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/compras/1/comentarios', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/compras/1/archivos', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/proveedores', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/productos', ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto'], []],
      ['/api/productos/autocompletar?q=ce', ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto'], []],
      ['/api/ordenes-compra', ['administrador', 'compras', 'bodega'], ['caja', 'ventas', 'reparto']],
      ['/api/ordenes-compra/stock-bajo', ['administrador', 'compras', 'bodega'], ['caja', 'ventas', 'reparto']],
      ['/api/reportes-compras/resumen', ['administrador', 'compras', 'bodega', 'caja'], ['ventas', 'reparto']],
      ['/api/configuracion-empresa', ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto'], []]
    ];

    for (const [ruta, permitidos, denegados] of lectura) {
      for (const rol of permitidos) {
        const r = await api(ruta, { rol });
        check(`GET ${ruta} (${rol})`, r.status === 200, `status ${r.status}`);
      }
      for (const rol of denegados) {
        const r = await api(ruta, { rol });
        check(`GET ${ruta} (${rol}) denegado`, r.status === 403, `status ${r.status}`);
      }
    }

    const escrituras = [
      ['POST', '/api/compras', {}, ['administrador', 'compras'], ['bodega', 'caja', 'ventas', 'reparto']],
      ['POST', '/api/compras/1/anular', {}, ['administrador'], ['compras', 'bodega', 'caja']],
      ['POST', '/api/compras/1/pagos', {}, ['administrador', 'compras', 'caja'], ['bodega', 'ventas', 'reparto']],
      ['DELETE', '/api/compras/1/pagos/999999', null, ['administrador'], ['compras', 'caja', 'bodega']],
      ['POST', '/api/proveedores', {}, ['administrador', 'compras'], ['bodega', 'caja']],
      ['DELETE', '/api/proveedores/999999', null, ['administrador'], ['compras', 'bodega']],
      ['POST', '/api/productos', {}, ['administrador', 'compras', 'bodega'], ['caja', 'ventas', 'reparto']],
      ['DELETE', '/api/productos/999999', null, ['administrador'], ['bodega', 'compras']],
      ['POST', '/api/ordenes-compra', {}, ['administrador', 'compras'], ['bodega', 'caja']],
      ['POST', '/api/ordenes-compra/1/recibir', {}, ['administrador', 'compras', 'bodega'], ['caja', 'ventas']],
      ['PUT', '/api/configuracion-empresa', {}, ['administrador'], ['compras', 'bodega', 'caja', 'ventas', 'reparto']]
    ];

    for (const [metodo, ruta, body, permitidos, denegados] of escrituras) {
      for (const rol of permitidos) {
        const r = await api(ruta, { rol, metodo, body });
        check(`${metodo} ${ruta} (${rol})`, r.status < 500 && r.status !== 401 && r.status !== 403, `status ${r.status}`);
      }
      for (const rol of denegados) {
        const r = await api(ruta, { rol, metodo, body });
        check(`${metodo} ${ruta} (${rol}) denegado`, r.status === 403, `status ${r.status}`);
      }
    }

    for (const rol of ['compras', 'bodega']) {
      const r = await api('/api/productos', { rol });
      const producto = r.body?.data?.[0];
      check(
        `GET /api/productos (${rol}) incluye costos`,
        producto && 'costo_ultimo' in producto && 'costo_promedio' in producto,
        JSON.stringify(producto)
      );
    }
    for (const rol of ['caja', 'ventas', 'reparto']) {
      const r = await api('/api/productos', { rol });
      const producto = r.body?.data?.[0];
      check(
        `GET /api/productos (${rol}) oculta costos`,
        producto && !('costo_ultimo' in producto) && !('costo_promedio' in producto),
        JSON.stringify(producto)
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
  console.log('\nTodas las pruebas de permisos de Compras pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
