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
  const nit = `CLI-${sufijo}`;
  const correo = `cliente.${sufijo}@example.com`;
  let clienteId = null;

  try {
    for (const rol of ['administrador', 'ventas', 'caja']) {
      const listado = await api('/api/clientes', rol);
      check(`listar clientes habilitado para ${rol}`, listado.status === 200, `status ${listado.status}`);
    }

    for (const rol of ['bodega', 'compras', 'reparto']) {
      const listado = await api('/api/clientes', rol);
      check(`listar clientes denegado para ${rol}`, listado.status === 403, `status ${listado.status}`);
    }

    const defaultCliente = await api('/api/clientes?q=CF', 'administrador');
    const consumidor = defaultCliente.body?.data?.find((cliente) => cliente.nit === 'CF');
    check('existe el cliente Consumidor Final', Boolean(consumidor), JSON.stringify(defaultCliente.body));
    check('Consumidor Final está activo y marcado como predeterminado', consumidor?.estado === 'activo' && consumidor?.es_predeterminado === true, JSON.stringify(consumidor));

    const editarDefault = await api(`/api/clientes/${consumidor?.id}`, 'administrador', 'PUT', {
      nit: 'CF',
      nombre: 'Consumidor Final',
      dias_credito: 0,
      limite_credito: 0,
      estado: 'activo'
    });
    check('bloquea editar Consumidor Final', editarDefault.status === 409, JSON.stringify(editarDefault.body));

    const inactivarDefault = await api(`/api/clientes/${consumidor?.id}/estado`, 'administrador', 'PATCH', {
      estado: 'inactivo'
    });
    check('bloquea inactivar Consumidor Final', inactivarDefault.status === 409, JSON.stringify(inactivarDefault.body));

    const sinNit = await api('/api/clientes', 'administrador', 'POST', { nombre: 'Sin NIT' });
    check('rechaza cliente sin NIT', sinNit.status === 400, `status ${sinNit.status}`);

    const sinNombre = await api('/api/clientes', 'administrador', 'POST', { nit: `SIN-${sufijo}` });
    check('rechaza cliente sin nombre', sinNombre.status === 400, `status ${sinNombre.status}`);

    const correoInvalido = await api('/api/clientes', 'administrador', 'POST', {
      nit: `COR-${sufijo}`,
      nombre: 'Correo inválido',
      correo: 'correo-invalido'
    });
    check('rechaza correo inválido', correoInvalido.status === 400, `status ${correoInvalido.status}`);

    const limiteNegativo = await api('/api/clientes', 'administrador', 'POST', {
      nit: `LIM-${sufijo}`,
      nombre: 'Límite negativo',
      limite_credito: -1
    });
    check('rechaza límite de crédito negativo', limiteNegativo.status === 400, `status ${limiteNegativo.status}`);

    const crear = await api('/api/clientes', 'administrador', 'POST', {
      nit: nit.toLowerCase(),
      nombre: `Cliente prueba ${sufijo}`,
      telefono: '5555-1234',
      correo,
      direccion: 'Ciudad de Guatemala',
      dias_credito: 30,
      limite_credito: 1500,
      estado: 'activo'
    });
    check('crea cliente', crear.status === 201, JSON.stringify(crear.body));
    clienteId = crear.body?.data?.id;

    const duplicado = await api('/api/clientes', 'administrador', 'POST', {
      nit,
      nombre: 'Duplicado'
    });
    check('rechaza NIT duplicado', duplicado.status === 409, `status ${duplicado.status}`);

    const detalle = await api(`/api/clientes/${clienteId}`, 'administrador');
    check('consulta el detalle del cliente', detalle.status === 200, `status ${detalle.status}`);
    check('normaliza el NIT a mayúsculas', detalle.body?.data?.nit === nit, JSON.stringify(detalle.body?.data));
    check('el cliente nuevo no tiene saldo pendiente', detalle.body?.data?.saldo_actual === 0, JSON.stringify(detalle.body?.data));
    check('el detalle inicia con historial de facturas vacío', Array.isArray(detalle.body?.data?.facturas) && detalle.body.data.facturas.length === 0, JSON.stringify(detalle.body?.data));

    const buscar = await api(`/api/clientes?q=${encodeURIComponent(nit)}`, 'administrador');
    check('busca clientes por NIT', buscar.status === 200 && buscar.body?.data?.some((cliente) => cliente.id === clienteId), JSON.stringify(buscar.body));

    const filtroActivo = await api('/api/clientes?estado=activo', 'administrador');
    check('filtra clientes activos', filtroActivo.status === 200 && filtroActivo.body?.data?.every((cliente) => cliente.estado === 'activo'), JSON.stringify(filtroActivo.body));

    const resumen = await api('/api/clientes/resumen', 'administrador');
    check(
      'el resumen devuelve activos, con saldo y total por cobrar',
      resumen.status === 200 &&
        typeof resumen.body?.data?.activos === 'number' &&
        typeof resumen.body?.data?.con_saldo_pendiente === 'number' &&
        typeof resumen.body?.data?.total_por_cobrar === 'number',
      JSON.stringify(resumen.body)
    );

    const actualizar = await api(`/api/clientes/${clienteId}`, 'administrador', 'PUT', {
      nit,
      nombre: `Cliente prueba ${sufijo} editado`,
      telefono: '4444-5678',
      correo,
      direccion: 'Mixco, Guatemala',
      dias_credito: 15,
      limite_credito: 2500,
      estado: 'activo'
    });
    check('actualiza el cliente', actualizar.status === 200, JSON.stringify(actualizar.body));

    const inactivar = await api(`/api/clientes/${clienteId}/estado`, 'administrador', 'PATCH', {
      estado: 'inactivo'
    });
    check('inactiva el cliente', inactivar.status === 200, JSON.stringify(inactivar.body));

    const filtroInactivo = await api('/api/clientes?estado=inactivo', 'administrador');
    check('filtra clientes inactivos', filtroInactivo.status === 200 && filtroInactivo.body?.data?.some((cliente) => cliente.id === clienteId), JSON.stringify(filtroInactivo.body));

    const activar = await api(`/api/clientes/${clienteId}/estado`, 'administrador', 'PATCH', {
      estado: 'activo'
    });
    check('activa el cliente', activar.status === 200, JSON.stringify(activar.body));

    const crearBodega = await api('/api/clientes', 'bodega', 'POST', {
      nit: `BOD-${sufijo}`,
      nombre: 'No permitido'
    });
    check('crear cliente denegado para bodega', crearBodega.status === 403, `status ${crearBodega.status}`);

    const sinToken = await fetch(`${base}/api/clientes`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    const inexistente = await api('/api/clientes/999999', 'administrador');
    check('responde 404 para cliente inexistente', inexistente.status === 404, `status ${inexistente.status}`);
  } finally {
    if (clienteId) {
      await db.pool.query('DELETE FROM clientes WHERE id = ?', [clienteId]);
    }
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de Clientes pasaron.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
