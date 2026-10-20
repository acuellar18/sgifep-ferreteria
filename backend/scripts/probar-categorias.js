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

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tokens = {
    administrador: token(['administrador']),
    compras: token(['compras']),
    bodega: token(['bodega']),
    caja: token(['caja']),
    ventas: token(['ventas']),
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
  const nombre = `Prueba Categorías ${sufijo}`;
  const nombreEditado = `${nombre} editada`;
  let categoriaId = null;
  let productoId = null;

  try {
    for (const rol of ['administrador', 'compras', 'bodega']) {
      const listado = await api('/api/categorias', rol);
      check(`listar categorías habilitado para ${rol}`, listado.status === 200, `status ${listado.status}`);
    }

    for (const rol of ['caja', 'ventas', 'reparto']) {
      const listado = await api('/api/categorias', rol);
      check(`listar categorías denegado para ${rol}`, listado.status === 403, `status ${listado.status}`);
    }

    for (const rol of ['compras', 'bodega']) {
      const crear = await api('/api/categorias', rol, 'POST', { nombre: `Denegada ${sufijo}` });
      check(`crear categoría denegado para ${rol}`, crear.status === 403, `status ${crear.status}`);
    }

    const vacia = await api('/api/categorias', 'administrador', 'POST', { nombre: '   ' });
    check('rechaza nombre vacío', vacia.status === 400, `status ${vacia.status}`);

    const larga = await api('/api/categorias', 'administrador', 'POST', { nombre: 'X'.repeat(101) });
    check('rechaza nombre demasiado largo', larga.status === 400, `status ${larga.status}`);

    const crear = await api('/api/categorias', 'administrador', 'POST', {
      nombre,
      descripcion: 'Categoría temporal para pruebas'
    });
    check('crea categoría con administrador', crear.status === 201, JSON.stringify(crear.body));
    categoriaId = crear.body?.data?.id;

    const duplicada = await api('/api/categorias', 'administrador', 'POST', {
      nombre: nombre.toUpperCase(),
      descripcion: 'Duplicada'
    });
    check('rechaza nombre duplicado sin distinguir mayúsculas', duplicada.status === 409, `status ${duplicada.status}`);

    const detalle = await api(`/api/categorias/${categoriaId}`, 'administrador');
    check('consulta el detalle de la categoría', detalle.status === 200, `status ${detalle.status}`);
    check('el código de categoría es estable', detalle.body?.data?.codigo === `CAT-${String(categoriaId).padStart(3, '0')}`, JSON.stringify(detalle.body?.data));
    check('la categoría nueva no tiene productos', detalle.body?.data?.productos === 0, JSON.stringify(detalle.body?.data));

    const buscar = await api(`/api/categorias?q=${encodeURIComponent(String(sufijo))}`, 'administrador');
    check('busca categorías por nombre', buscar.status === 200 && buscar.body?.data?.some((c) => c.id === categoriaId), JSON.stringify(buscar.body?.data));

    const filtroActivo = await api('/api/categorias?estado=activo', 'administrador');
    check('filtra categorías activas', filtroActivo.status === 200 && filtroActivo.body?.data?.every((c) => c.activo === true), JSON.stringify(filtroActivo.body?.data));

    const editar = await api(`/api/categorias/${categoriaId}`, 'administrador', 'PUT', {
      nombre: nombreEditado,
      descripcion: 'Descripción actualizada',
      activo: true
    });
    check('actualiza la categoría', editar.status === 200, JSON.stringify(editar.body));

    const editarAjeno = await api(`/api/categorias/${categoriaId}`, 'compras', 'PUT', {
      nombre: `${nombreEditado} otra`,
      descripcion: '',
      activo: true
    });
    check('editar categoría denegado para compras', editarAjeno.status === 403, `status ${editarAjeno.status}`);

    const inactivar = await api(`/api/categorias/${categoriaId}/estado`, 'administrador', 'PATCH', { activo: 0 });
    check('inactiva la categoría', inactivar.status === 200, JSON.stringify(inactivar.body));
    const inactivas = await api('/api/categorias?estado=inactivo', 'administrador');
    check('filtra categorías inactivas', inactivas.status === 200 && inactivas.body?.data?.some((c) => c.id === categoriaId), JSON.stringify(inactivas.body?.data));

    const estadoInvalido = await api(`/api/categorias/${categoriaId}/estado`, 'administrador', 'PATCH', { activo: 2 });
    check('rechaza estado inválido', estadoInvalido.status === 400, `status ${estadoInvalido.status}`);

    const eliminarAjeno = await api(`/api/categorias/${categoriaId}`, 'compras', 'DELETE');
    check('eliminar categoría denegado para compras', eliminarAjeno.status === 403, `status ${eliminarAjeno.status}`);

    const [producto] = await db.pool.query(
      `INSERT INTO productos (codigo, nombre, categoria_id, unidad_medida, stock_minimo, precio_venta, activo)
       VALUES (?, 'Producto de prueba de categorías', ?, 'UNI', 0, 0, 1)`,
      [`CAT-PRUEBA-${sufijo}`, categoriaId]
    );
    productoId = producto.insertId;

    const eliminarConProductos = await api(`/api/categorias/${categoriaId}`, 'administrador', 'DELETE');
    check('bloquea eliminar categoría con productos', eliminarConProductos.status === 409, JSON.stringify(eliminarConProductos.body));

    const detalleConProducto = await api(`/api/categorias/${categoriaId}`, 'administrador');
    check('cuenta los productos asociados', detalleConProducto.body?.data?.productos === 1, JSON.stringify(detalleConProducto.body?.data));

    await db.pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
    productoId = null;

    const eliminar = await api(`/api/categorias/${categoriaId}`, 'administrador', 'DELETE');
    check('elimina una categoría sin productos', eliminar.status === 200, JSON.stringify(eliminar.body));
    categoriaId = null;

    const inexistente = await api('/api/categorias/999999', 'administrador');
    check('responde 404 para categoría inexistente', inexistente.status === 404, `status ${inexistente.status}`);

    const sinToken = await fetch(`${base}/api/categorias`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);
  } finally {
    if (productoId) await db.pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
    if (categoriaId) await db.pool.query('DELETE FROM categorias WHERE id = ?', [categoriaId]);
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Categorías pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
