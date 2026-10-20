const jwt = require('jsonwebtoken');
const sharp = require('sharp');
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
  const codigoProducto = `PROD-${sufijo}`;
  const codigoServicio = `SERV-${sufijo}`;
  const codigoBarras = `750${sufijo}`;
  const nombreProducto = `Producto prueba ${sufijo}`;
  const nombreServicio = `Servicio prueba ${sufijo}`;
  const nombreProveedor = `Proveedor productos ${sufijo}`;
  let categoriaId = null;
  let categoriaServicioId = null;
  let productoId = null;
  let servicioId = null;
  let proveedorId = null;
  let compraId = null;

  try {
    for (const rol of ['administrador', 'compras', 'bodega', 'caja', 'ventas', 'reparto']) {
      const listado = await api('/api/productos', rol);
      check(`listar productos habilitado para ${rol}`, listado.status === 200, `status ${listado.status}`);
    }

    const [categoria] = await db.pool.query(
      'INSERT INTO categorias (nombre, descripcion, activo) VALUES (?, ?, 1)',
      [`Categoría productos ${sufijo}`, 'Temporal']
    );
    categoriaId = categoria.insertId;

    const [categoriaServicio] = await db.pool.query(
      'INSERT INTO categorias (nombre, descripcion, activo) VALUES (?, ?, 1)',
      [`Categoría servicios ${sufijo}`, 'Temporal']
    );
    categoriaServicioId = categoriaServicio.insertId;


    const sinCodigo = await api('/api/productos', 'administrador', 'POST', { nombre: 'Sin código' });
    check('rechaza producto sin código', sinCodigo.status === 400, `status ${sinCodigo.status}`);

    const servicioConStock = await api('/api/productos', 'administrador', 'POST', {
      codigo: `${codigoServicio}-X`,
      nombre: 'Servicio inválido',
      tipo: 'servicio',
      stock_inicial: 1
    });
    check('rechaza inventario inicial en servicios', servicioConStock.status === 400, `status ${servicioConStock.status}`);

    for (const rol of ['caja', 'ventas', 'reparto']) {
      const crear = await api('/api/productos', rol, 'POST', {
        codigo: `DENEGADO-${rol}-${sufijo}`,
        nombre: 'Denegado'
      });
      check(`crear producto denegado para ${rol}`, crear.status === 403, `status ${crear.status}`);
    }

    const crearProducto = await api('/api/productos', 'administrador', 'POST', {
      codigo: codigoProducto.toLowerCase(),
      codigo_barras: codigoBarras,
      nombre: nombreProducto,
      descripcion: 'Producto temporal para pruebas',
      categoria_id: categoriaId,
      tipo: 'producto',
      unidad_medida: 'UNI',
      stock_minimo: 2,
      precio_venta: 15.5,
      stock_inicial: 5,
      costo_inicial: 10,
      activo: true
    });
    check('crea producto con inventario inicial', crearProducto.status === 201, JSON.stringify(crearProducto.body));
    productoId = crearProducto.body?.data?.id;

    const detalle = await api(`/api/productos/${productoId}`, 'administrador');
    check('consulta el detalle del producto', detalle.status === 200, `status ${detalle.status}`);
    check('normaliza el código a mayúsculas', detalle.body?.data?.codigo === codigoProducto, JSON.stringify(detalle.body?.data));
    check('registra el stock inicial', Number(detalle.body?.data?.stock_actual) === 5, JSON.stringify(detalle.body?.data));
    check('registra el costo inicial', Number(detalle.body?.data?.costo_ultimo) === 10, JSON.stringify(detalle.body?.data));
    check('el producto no está en stock bajo', detalle.body?.data?.stock_bajo === false, JSON.stringify(detalle.body?.data));

    const [movimientoInicial] = await db.pool.query(
      `SELECT tipo, origen, cantidad, costo_unitario, saldo_resultante, motivo
       FROM movimientos_inventario WHERE producto_id = ?`,
      [productoId]
    );
    check('genera movimiento de inventario inicial', movimientoInicial.length === 1, JSON.stringify(movimientoInicial));
    check(
      'el movimiento inicial deja saldo y motivo correctos',
      movimientoInicial[0]?.origen === 'inventario_inicial' &&
        Number(movimientoInicial[0]?.cantidad) === 5 &&
        Number(movimientoInicial[0]?.saldo_resultante) === 5 &&
        Boolean(movimientoInicial[0]?.motivo),
      JSON.stringify(movimientoInicial[0])
    );

    const duplicadoCodigo = await api('/api/productos', 'administrador', 'POST', {
      codigo: codigoProducto,
      nombre: 'Duplicado'
    });
    check('rechaza código duplicado', duplicadoCodigo.status === 409, `status ${duplicadoCodigo.status}`);

    const duplicadoBarras = await api('/api/productos', 'administrador', 'POST', {
      codigo: `OTRO-${sufijo}`,
      codigo_barras: codigoBarras,
      nombre: 'Duplicado'
    });
    check('rechaza código de barras duplicado', duplicadoBarras.status === 409, `status ${duplicadoBarras.status}`);

    const lista = await api(`/api/productos?q=${encodeURIComponent(codigoBarras)}`, 'administrador');
    check(
      'busca productos por código de barras',
      lista.status === 200 && lista.body?.data?.some((p) => p.id === productoId),
      JSON.stringify(lista.body)
    );

    const filtroServicio = await api('/api/productos?tipo=servicio', 'administrador');
    check(
      'filtra productos por tipo',
      filtroServicio.status === 200 && filtroServicio.body?.data?.every((p) => p.tipo === 'servicio'),
      JSON.stringify(filtroServicio.body?.data)
    );

    const cajaDetalle = await api(`/api/productos/${productoId}`, 'caja');
    check('oculta costos a caja', cajaDetalle.status === 200 && cajaDetalle.body?.data?.costo_ultimo === undefined, JSON.stringify(cajaDetalle.body?.data));

    const editar = await api(`/api/productos/${productoId}`, 'administrador', 'PUT', {
      codigo: codigoProducto,
      codigo_barras: codigoBarras,
      nombre: `${nombreProducto} editado`,
      descripcion: 'Descripción actualizada',
      categoria_id: categoriaId,
      tipo: 'producto',
      unidad_medida: 'UNI',
      stock_minimo: 3,
      precio_venta: 18,
      activo: true
    });
    check('actualiza el producto', editar.status === 200, JSON.stringify(editar.body));

    const convertirServicio = await api(`/api/productos/${productoId}`, 'administrador', 'PUT', {
      codigo: codigoProducto,
      codigo_barras: codigoBarras,
      nombre: `${nombreProducto} editado`,
      categoria_id: categoriaId,
      tipo: 'servicio',
      unidad_medida: 'UNI',
      stock_minimo: 3,
      precio_venta: 18,
      activo: true
    });
    check('bloquea convertir en servicio un producto con stock', convertirServicio.status === 409, `status ${convertirServicio.status}`);

    const crearServicio = await api('/api/productos', 'administrador', 'POST', {
      codigo: codigoServicio,
      nombre: nombreServicio,
      categoria_id: categoriaServicioId,
      tipo: 'servicio',
      unidad_medida: 'UNI',
      stock_minimo: 0,
      precio_venta: 250,
      costo_inicial: 100,
      activo: true
    });
    check('crea un servicio sin inventario', crearServicio.status === 201, JSON.stringify(crearServicio.body));
    servicioId = crearServicio.body?.data?.id;

    const [movimientosServicio] = await db.pool.query(
      'SELECT COUNT(*) AS total FROM movimientos_inventario WHERE producto_id = ?',
      [servicioId]
    );
    check('el servicio no genera movimientos', Number(movimientosServicio[0]?.total) === 0, JSON.stringify(movimientosServicio[0]));

    let triggerRechazo = false;
    try {
      await db.pool.query(
        `INSERT INTO movimientos_inventario
          (producto_id, tipo, origen, cantidad, costo_unitario, motivo, usuario_id)
         VALUES (?, 'entrada', 'ajuste_manual', 1, 1, 'Prueba', 1)`,
        [servicioId]
      );
    } catch (err) {
      triggerRechazo = err.sqlState === '45000' || /servicios no controlan/i.test(err.sqlMessage || '');
    }
    check('el trigger rechaza movimientos de servicios', triggerRechazo, String(triggerRechazo));

    const [proveedor] = await db.pool.query(
      `INSERT INTO proveedores (nombre, nit, dias_credito, activo)
       VALUES (?, ?, 0, 1)`,
      [nombreProveedor, `NIT-${sufijo}`]
    );
    proveedorId = proveedor.insertId;

    const crearCompra = await api('/api/compras', 'administrador', 'POST', {
      proveedor_id: proveedorId,
      fecha: new Date().toISOString().slice(0, 10),
      numero_factura: `F-${sufijo}`,
      condicion: 'contado',
      detalles: [{ producto_id: servicioId, cantidad: 1, costo_unitario: 100 }]
    });
    check('registra una compra con servicio', crearCompra.status === 201, JSON.stringify(crearCompra.body));
    compraId = crearCompra.body?.data?.id;

    const [stockServicio] = await db.pool.query('SELECT stock_actual FROM productos WHERE id = ?', [servicioId]);
    const [movimientosCompra] = await db.pool.query(
      'SELECT COUNT(*) AS total FROM movimientos_inventario WHERE producto_id = ?',
      [servicioId]
    );
    check('la compra de un servicio no modifica stock', Number(stockServicio[0]?.stock_actual) === 0, JSON.stringify(stockServicio[0]));
    check('la compra de un servicio no crea movimientos', Number(movimientosCompra[0]?.total) === 0, JSON.stringify(movimientosCompra[0]));

    const reporte = await api('/api/reportes-inventario/resumen', 'administrador');
    check(
      'el reporte excluye servicios de las categorías',
      reporte.status === 200 && !(reporte.body?.data?.categorias || []).some((c) => c.id === categoriaServicioId),
      JSON.stringify(reporte.body?.data?.categorias)
    );

    const imagenBuffer = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 234, g: 88, b: 12, alpha: 1 } }
    }).png().toBuffer();

    async function subirImagen(contenido, mime = 'image/png', nombre = 'producto.png') {
      const form = new FormData();
      form.append('imagen', new Blob([contenido], { type: mime }), nombre);
      return fetch(`${base}/api/productos/${productoId}/imagen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.administrador}` },
        body: form
      });
    }

    const subida = await subirImagen(imagenBuffer);
    check('sube y procesa la imagen del producto', subida.status === 201, `status ${subida.status}`);

    const imagen = await fetch(`${base}/api/productos/${productoId}/imagen`, {
      headers: { Authorization: `Bearer ${tokens.caja}` }
    });
    const imagenBytes = Buffer.from(await imagen.arrayBuffer());
    check('sirve la imagen autenticada a caja', imagen.status === 200 && imagenBytes.length > 0, `status ${imagen.status}`);
    check('entrega la imagen en WebP', imagen.headers.get('content-type')?.includes('image/webp'), imagen.headers.get('content-type'));

    const miniatura = await fetch(`${base}/api/productos/${productoId}/imagen/miniatura`, {
      headers: { Authorization: `Bearer ${tokens.administrador}` }
    });
    check('sirve la miniatura autenticada', miniatura.status === 200, `status ${miniatura.status}`);

    const sinTokenImagen = await fetch(`${base}/api/productos/${productoId}/imagen`);
    check('la imagen exige token', sinTokenImagen.status === 401, `status ${sinTokenImagen.status}`);

    const invalida = await subirImagen(Buffer.from('no es una imagen'), 'image/png');
    check('rechaza contenido de imagen inválido', invalida.status === 400, `status ${invalida.status}`);

    const detalleConImagen = await api(`/api/productos/${productoId}`, 'administrador');
    check('expone la existencia de imagen', detalleConImagen.body?.data?.imagen === true && detalleConImagen.body?.data?.imagen_miniatura === true, JSON.stringify(detalleConImagen.body?.data));

    const eliminarImagen = await api(`/api/productos/${productoId}/imagen`, 'administrador', 'DELETE');
    check('elimina la imagen del producto', eliminarImagen.status === 200, JSON.stringify(eliminarImagen.body));

    const eliminarAjeno = await api(`/api/productos/${productoId}`, 'compras', 'DELETE');
    check('eliminar producto denegado para compras', eliminarAjeno.status === 403, `status ${eliminarAjeno.status}`);

    const eliminarConMovimientos = await api(`/api/productos/${productoId}`, 'administrador', 'DELETE');
    check('bloquea eliminar producto con movimientos', eliminarConMovimientos.status === 409, JSON.stringify(eliminarConMovimientos.body));

    const estadoInvalido = await api(`/api/productos/${servicioId}/estado`, 'administrador', 'PATCH', { activo: 2 });
    check('rechaza estado inválido', estadoInvalido.status === 400, `status ${estadoInvalido.status}`);

    const inactivar = await api(`/api/productos/${servicioId}/estado`, 'administrador', 'PATCH', { activo: 0 });
    check('inactiva el servicio', inactivar.status === 200, JSON.stringify(inactivar.body));

    const sinToken = await fetch(`${base}/api/productos`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    const inexistente = await api('/api/productos/999999', 'administrador');
    check('responde 404 para producto inexistente', inexistente.status === 404, `status ${inexistente.status}`);
  } finally {
    await db.pool.query('SET @sgifep_reset = 1');
    if (compraId) {
      await db.pool.query('DELETE FROM pagos_compra WHERE compra_id = ?', [compraId]);
      await db.pool.query('DELETE FROM detalle_compra WHERE compra_id = ?', [compraId]);
      await db.pool.query('DELETE FROM compras WHERE id = ?', [compraId]);
    }
    if (productoId) {
      await db.pool.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [productoId]);
      await db.pool.query('DELETE FROM productos WHERE id = ?', [productoId]);
    }
    if (servicioId) {
      await db.pool.query('DELETE FROM movimientos_inventario WHERE producto_id = ?', [servicioId]);
      await db.pool.query('DELETE FROM productos WHERE id = ?', [servicioId]);
    }
    if (proveedorId) await db.pool.query('DELETE FROM proveedores WHERE id = ?', [proveedorId]);
    if (categoriaId) await db.pool.query('DELETE FROM categorias WHERE id = ?', [categoriaId]);
    if (categoriaServicioId) await db.pool.query('DELETE FROM categorias WHERE id = ?', [categoriaServicioId]);
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Productos pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
