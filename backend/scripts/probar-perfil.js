const path = require('path');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const app = require('../server');
const db = require('../db');
const { jwt: jwtConfig } = require('../config/auth');
const { DIRECTORIO } = require('../middlewares/upload-perfil.middleware');

let fallos = 0;

function check(nombre, condicion, detalle = '') {
  if (condicion) {
    console.log('OK  ', nombre);
  } else {
    fallos += 1;
    console.error('FAIL', nombre, detalle);
  }
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sufijo = Date.now();
  let usuarioId = null;
  let fotoGuardada = null;

  async function api(ruta, metodo = 'GET', body, tokenJwt = token()) {
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

  function token() {
    return jwt.sign(
      { sub: usuarioId, username: `perfil_prueba_${sufijo}`, nombre: 'Prueba Perfil', roles: ['ventas'] },
      jwtConfig.secreto,
      { expiresIn: '1h' }
    );
  }

  try {
    const [usuarios] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, 'ventas', 1)`,
      [
        'Perfil',
        'Prueba',
        `PER-${sufijo}`,
        `perfil_prueba_${sufijo}`,
        bcrypt.hashSync('prueba123', 4)
      ]
    );
    usuarioId = usuarios.insertId;

    console.log('\n--- Autenticacion ---');
    const sinToken = await fetch(`${base}/api/perfil`);
    check('sin token responde 401', sinToken.status === 401, `status ${sinToken.status}`);

    console.log('\n--- Consulta y edicion ---');
    const detalle = await api('/api/perfil');
    check('consulta perfil', detalle.status === 200, JSON.stringify(detalle.body));
    check('devuelve usuario de la sesion', detalle.body?.data?.username === `perfil_prueba_${sufijo}`, JSON.stringify(detalle.body));
    check('inicia sin foto', detalle.body?.data?.tiene_foto === false, JSON.stringify(detalle.body));

    const actualizar = await api('/api/perfil', 'PUT', {
      nombre: 'Perfil Editado',
      apellido: 'Apellido',
      correo: `perfil.${sufijo}@example.com`
    });
    check('actualiza perfil', actualizar.status === 200, JSON.stringify(actualizar.body));
    check('guarda nombre', actualizar.body?.data?.nombre === 'Perfil Editado', JSON.stringify(actualizar.body));
    check('guarda correo', actualizar.body?.data?.correo === `perfil.${sufijo}@example.com`, JSON.stringify(actualizar.body));

    const correoInvalido = await api('/api/perfil', 'PUT', {
      nombre: 'Perfil Editado',
      apellido: 'Apellido',
      correo: 'correo-invalido'
    });
    check('rechaza correo invalido', correoInvalido.status === 400, `status ${correoInvalido.status}`);

    const nombreVacio = await api('/api/perfil', 'PUT', { nombre: '   ', correo: '' });
    check('rechaza nombre vacio', nombreVacio.status === 400, `status ${nombreVacio.status}`);

    console.log('\n--- Foto de perfil ---');
    const imagen = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: { r: 234, g: 88, b: 12 }
      }
    }).png().toBuffer();

    const formulario = new FormData();
    formulario.append('foto', new Blob([imagen], { type: 'image/png' }), 'perfil.png');
    const subir = await fetch(`${base}/api/perfil/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: formulario
    });
    const subirJson = await subir.json().catch(() => null);
    check('sube foto', subir.status === 201, JSON.stringify(subirJson));
    check('marca foto', subirJson?.data?.tiene_foto === true, JSON.stringify(subirJson));

    const [fotos] = await db.query('SELECT foto FROM usuarios WHERE id = ?', [usuarioId]);
    fotoGuardada = fotos[0]?.foto || null;
    check('guarda archivo webp', Boolean(fotoGuardada?.endsWith('.webp')), fotoGuardada || 'sin archivo');

    const descargar = await fetch(`${base}/api/perfil/foto`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    check('descarga foto', descargar.status === 200, `status ${descargar.status}`);
    check('sirve webp', (descargar.headers.get('content-type') || '').includes('image/webp'), descargar.headers.get('content-type'));

    const eliminar = await api('/api/perfil/foto', 'DELETE');
    check('elimina foto', eliminar.status === 200 && eliminar.body?.data?.tiene_foto === false, JSON.stringify(eliminar.body));
    fotoGuardada = null;

    const descargarEliminada = await fetch(`${base}/api/perfil/foto`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    check('foto eliminada responde 404', descargarEliminada.status === 404, `status ${descargarEliminada.status}`);

    const eliminarOtraVez = await api('/api/perfil/foto', 'DELETE');
    check('segunda eliminacion responde 404', eliminarOtraVez.status === 404, `status ${eliminarOtraVez.status}`);
  } finally {
    if (usuarioId) {
      const [fotos] = await db.query('SELECT foto FROM usuarios WHERE id = ?', [usuarioId]);
      const archivo = fotoGuardada || fotos[0]?.foto;
      if (archivo) {
        await fs.unlink(path.join(DIRECTORIO, path.basename(archivo))).catch(() => {});
      }
      await db.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
    }
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  }

  if (fallos > 0) {
    console.error(`\n${fallos} prueba(s) de perfil fallaron.`);
    process.exit(1);
  }
  console.log('\nTodas las pruebas de perfil pasaron.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
