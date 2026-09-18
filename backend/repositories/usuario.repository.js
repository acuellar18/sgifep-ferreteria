const pool = require('../db');

// Whitelist de columnas ordenables desde el listado. Nunca se interpola el
// valor de sortBy directo en el SQL (evita inyección vía ORDER BY): solo se
// usa como llave para elegir una expresión SQL fija de esta tabla.
const COLUMNAS_ORDENABLES = {
  nombre: 'u.nombre',
  apellido: 'u.apellido',
  codigo: 'u.codigo',
  username: 'u.username',
  creado_en: 'u.creado_en',
  departamento_nombre: 'departamento_nombre'
};

// Repository Pattern: única capa que toca SQL de usuarios. Las operaciones que
// requieren transacción (crear/editar con roles) reciben una conexión.
class UsuarioRepository {
  async listar({
    q,
    estado,
    startDate,
    endDate,
    fechaInicio,
    fechaFin,
    departamento,
    rol,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
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

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const fromSql = `
      FROM usuarios u
      LEFT JOIN departamentos d ON d.id = u.departamento_id
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      ${whereSql}`;

    // Total de usuarios ÚNICOS que cumplen el filtro (para armar la paginación
    // en el frontend). Se cuenta antes de aplicar LIMIT/OFFSET.
    const [conteoRows] = await pool.query(`SELECT COUNT(DISTINCT u.id) AS total ${fromSql}`, params);
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'u.creado_en';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // pageSize acotado (1-100) para evitar que un valor arbitrario tumbe la
    // consulta o traiga la tabla completa de un jalón.
    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    // JOINs + GROUP_CONCAT: incluye nombre de departamento y lista de roles.
    const sql = `
      SELECT u.id, u.codigo, u.nombre, u.apellido, u.username, u.rol,
             u.departamento_id, u.activo, u.creado_en, u.actualizado_en,
             d.nombre AS departamento_nombre,
             COALESCE(GROUP_CONCAT(DISTINCT CONCAT(r.id, '::', r.nombre) ORDER BY r.id SEPARATOR '|'), '') AS roles
      ${fromSql}
      GROUP BY u.id
      ORDER BY ${columnaOrden} ${direccionOrden}, u.id DESC
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  // Reporte "inteligente": acepta los mismos filtros del listado (búsqueda,
  // estado, departamento, rol, rango de fechas) y calcula totales y
  // desgloses SOLO sobre el subconjunto de usuarios que los cumple.
  // Se resuelve en dos pasos simples (usuarios filtrados + sus roles) en vez
  // de un SQL único muy anidado, para que sea fácil de mantener y depurar.
  async reporte({ q, estado, startDate, endDate, departamento, rol } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.codigo LIKE ? OR u.username LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (estado === 'activo') where.push('u.activo = 1');
    else if (estado === 'inactivo') where.push('u.activo = 0');
    if (startDate) {
      where.push('DATE(u.creado_en) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('DATE(u.creado_en) <= ?');
      params.push(endDate);
    }
    if (departamento) {
      where.push('u.departamento_id = ?');
      params.push(Number(departamento));
    }
    if (rol) {
      where.push('ur.rol_id = ?');
      params.push(Number(rol));
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [usuariosFiltrados] = await pool.query(
      `SELECT DISTINCT u.id, u.activo, u.departamento_id
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
       ${whereSql}`,
      params
    );

    const ids = usuariosFiltrados.map((u) => u.id);
    let rolesPorUsuario = [];
    if (ids.length > 0) {
      // Se une `roles` para poder traer r.id/r.nombre: sin el JOIN, MySQL
      // responde "Unknown column 'r.id' in 'field list'" y el reporte caía
      // en un 500 (Error interno del servidor).
      const [rolesRows] = await pool.query(
        `SELECT ur.usuario_id, r.id, r.nombre
         FROM usuario_roles ur
         JOIN roles r ON r.id = ur.rol_id
         WHERE ur.usuario_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      rolesPorUsuario = rolesRows;
    }

    // Catálogos completos: así el reporte también muestra los departamentos
    // y roles con 0 usuarios (no solo los que aparecen en el filtro).
    const [departamentosTodos] = await pool.query(
      'SELECT id, nombre FROM departamentos ORDER BY nombre ASC'
    );
    const [rolesTodos] = await pool.query(
      'SELECT id, nombre, acceso_total FROM roles ORDER BY acceso_total DESC, nombre ASC'
    );

    const total = usuariosFiltrados.length;
    const activos = usuariosFiltrados.filter((u) => u.activo).length;
    const inactivos = total - activos;

    const porDepartamento = departamentosTodos.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      total_activos: usuariosFiltrados.filter((u) => u.activo && u.departamento_id === d.id).length
    }));

    const porRol = rolesTodos.map((r) => {
      const idsConEsteRol = new Set(
        rolesPorUsuario.filter((rp) => rp.id === r.id).map((rp) => rp.usuario_id)
      );
      const totalActivos = usuariosFiltrados.filter((u) => u.activo && idsConEsteRol.has(u.id)).length;
      return {
        id: r.id,
        nombre: r.nombre,
        acceso_total: Boolean(r.acceso_total),
        total_activos: totalActivos
      };
    });

    return { totales: { total, activos, inactivos }, porDepartamento, porRol };
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
}

module.exports = new UsuarioRepository();