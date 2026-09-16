const pool = require('../db');

// Repository Pattern: única capa que toca SQL de usuarios. Las operaciones que
// requieren transacción (crear/editar con roles) reciben una conexión.
class UsuarioRepository {
  async listar({ q, estado, startDate, endDate, fechaInicio, fechaFin, departamento, rol } = {}) {
    const where = [];
    const params = [];

    // Búsqueda general dinámica (LIKE) por código, nombre o apellido.
    if (q) {
      where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.codigo LIKE ? OR u.username LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (estado === 'activo') where.push('u.activo = 1');
    else if (estado === 'inactivo') where.push('u.activo = 0');

    // Rango de fechas de creación: acepta startDate/endDate (nuevo) o los
    // nombres legacy fechaInicio/fechaFin para no romper integraciones previas.
    const desde = startDate || fechaInicio;
    const hasta = endDate || fechaFin;
    if (desde) {
      where.push('DATE(u.creado_en) >= ?');
      params.push(desde);
    }
    if (hasta) {
      where.push('DATE(u.creado_en) <= ?');
      params.push(hasta);
    }
    if (departamento) {
      where.push('u.departamento_id = ?');
      params.push(Number(departamento));
    }
    if (rol) {
      where.push('ur.rol_id = ?');
      params.push(Number(rol));
    }

    // JOINs + GROUP_CONCAT: incluye nombre de departamento y lista de roles.
    const sql = `
      SELECT u.id, u.codigo, u.nombre, u.apellido, u.username, u.rol,
             u.departamento_id, u.activo, u.creado_en, u.actualizado_en,
             d.nombre AS departamento_nombre,
             COALESCE(GROUP_CONCAT(DISTINCT CONCAT(r.id, '::', r.nombre) ORDER BY r.id SEPARATOR '|'), '') AS roles
      FROM usuarios u
      LEFT JOIN departamentos d ON d.id = u.departamento_id
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY u.id
      ORDER BY u.creado_en DESC, u.id DESC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async buscarPorId(id) {
    const sql = `
      SELECT u.id, u.codigo, u.nombre, u.apellido, u.username, u.rol,
             u.departamento_id, u.activo, u.creado_en, u.actualizado_en,
             d.nombre AS departamento_nombre,
             COALESCE(GROUP_CONCAT(DISTINCT CONCAT(r.id, '::', r.nombre) ORDER BY r.id SEPARATOR '|'), '') AS roles
      FROM usuarios u
      LEFT JOIN departamentos d ON d.id = u.departamento_id
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      WHERE u.id = ?
      GROUP BY u.id`;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  async buscarPorUsername(username, excluirId = null) {
    const sql = 'SELECT id FROM usuarios WHERE username = ?';
    const params = [username];
    if (excluirId) {
      params.push(excluirId);
      return pool.query(`${sql} AND id <> ? LIMIT 1`, params).then(([rows]) => rows[0] || null);
    }
    return pool.query(`${sql} LIMIT 1`, params).then(([rows]) => rows[0] || null);
  }

  async buscarPorCodigo(codigo, excluirId = null) {
    const sql = 'SELECT id FROM usuarios WHERE codigo = ?';
    const params = [codigo];
    if (excluirId) {
      params.push(excluirId);
      return pool.query(`${sql} AND id <> ? LIMIT 1`, params).then(([rows]) => rows[0] || null);
    }
    return pool.query(`${sql} LIMIT 1`, params).then(([rows]) => rows[0] || null);
  }

  // Para autenticación (JWT): credenciales + estado. Nunca se expone por API.
  async buscarConCredenciales(username) {
    const [rows] = await pool.query(
      'SELECT id, nombre, username, password_hash, rol, activo FROM usuarios WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  }

  // Solo el hash actual (para conservarlo al editar sin cambiar contraseña).
  async obtenerPasswordHash(id) {
    const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [id]);
    return rows[0] ? rows[0].password_hash : null;
  }

  async crear(conn, datos) {
    const { nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO usuarios (nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo]
    );
    return result.insertId;
  }

  async actualizar(conn, id, datos) {
    const { nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `UPDATE usuarios
       SET nombre = ?, apellido = ?, codigo = ?, username = ?, password_hash = ?,
           rol = ?, departamento_id = ?, activo = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nombre, apellido, codigo, username, password_hash, rol, departamento_id, activo, id]
    );
    return result.affectedRows;
  }

  async cambiarEstado(id, activo) {
    const [result] = await pool.query(
      'UPDATE usuarios SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [activo, id]
    );
    return result.affectedRows;
  }

  async eliminar(id) {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async asignarRoles(conn, usuarioId, rolIds) {
    const destino = conn || pool;
    for (const rolId of rolIds) {
      await destino.query('INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)', [
        usuarioId,
        rolId
      ]);
    }
  }

  async reemplazarRoles(conn, usuarioId, rolIds) {
    const destino = conn || pool;
    await destino.query('DELETE FROM usuario_roles WHERE usuario_id = ?', [usuarioId]);
    await this.asignarRoles(destino, usuarioId, rolIds);
  }

  // Resumen para el reporte: totales y conteos por estado.
  async contarTotales() {
    const [filas] = await pool.query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
             SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
      FROM usuarios`);
    return filas[0];
  }

  async contarActivosPorDepartamento() {
    const [rows] = await pool.query(`
      SELECT d.id, d.nombre, COUNT(u.id) AS total_activos
      FROM departamentos d
      LEFT JOIN usuarios u ON u.departamento_id = d.id AND u.activo = 1
      GROUP BY d.id, d.nombre
      ORDER BY d.nombre ASC`);
    return rows;
  }

  async contarActivosPorRol() {
    const [rows] = await pool.query(`
      SELECT r.id, r.nombre, r.acceso_total, COUNT(DISTINCT u.id) AS total_activos
      FROM roles r
      LEFT JOIN usuario_roles ur ON ur.rol_id = r.id
      LEFT JOIN usuarios u ON u.id = ur.usuario_id AND u.activo = 1
      GROUP BY r.id, r.nombre, r.acceso_total
      ORDER BY r.acceso_total DESC, r.nombre ASC`);
    return rows;
  }
}

module.exports = new UsuarioRepository();