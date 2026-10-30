const pool = require('../db');

async function registrarAuditoria(conn, datos = {}) {
  const destino = conn || pool;
  const {
    usuarioId = datos.usuario_id ?? null,
    username = null,
    accion,
    entidad = null,
    entidadId = datos.entidad_id ?? null,
    descripcion = null,
    datos: payload = datos.payload ?? null,
    ip = null,
    userAgent = datos.user_agent ?? null
  } = datos;

  if (!accion) return;

  try {
    await destino.query(
      `INSERT INTO auditoria_eventos
         (usuario_id, username, accion, entidad, entidad_id, descripcion, datos, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        username,
        String(accion).slice(0, 80),
        entidad ? String(entidad).slice(0, 60) : null,
        entidadId === null || entidadId === undefined ? null : String(entidadId).slice(0, 60),
        descripcion ? String(descripcion).slice(0, 255) : null,
        payload ? JSON.stringify(payload).slice(0, 60000) : null,
        ip ? String(ip).slice(0, 45) : null,
        userAgent ? String(userAgent).slice(0, 255) : null
      ]
    );
  } catch (error) {
    console.error('No se pudo registrar la auditoría:', error.message);
  }
}

module.exports = { registrarAuditoria };
