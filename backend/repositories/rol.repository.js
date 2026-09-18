const pool = require('../db');

// Whitelist de columnas ordenables desde la tabla de roles. Solo se interpola
// la expresión SQL fija a la que apunta la llave, nunca el valor crudo que
// mande el cliente (misma protección que en los usuarios: evita inyección
// SQL vía ORDER BY). El alias 'numero_usuarios' es válido en MySQL porque
// MySQL permite ordenar por alias de una expresión del GROUP BY.
const COLUMNAS_ORDENABLES = {
  nombre: 'r.nombre',
  creado_en: 'r.creado_en',
  numero_usuarios: 'numero_usuarios'
};

// -----------------------------------------------
// DETECCIÓN DE ESQUEMA (defensiva)
// -----------------------------------------------
// El inicio de sesión y el CRUD de roles no deben colapsar con un 500 si la
// migración 002 (tablas `roles`/`usuario_roles`) o la 003 (columna
// `roles.superadmin`) aún no se aplicaron en la base de datos:
//   * Si `roles.superadmin` existe, se usa (y se sincroniza con acceso_total).
//   * Si la tabla `usuario_roles` NO existe, se degrada a una lista vacía de
//     roles (el rol legacy `usuarios.rol` sigue funcionando) en lugar de 500.
// -----------------------------------------------

let cacheSuperadmin = null;

async function esquemaConSuperadmin() {
  if (cacheSuperadmin === null) {
    try {
      const [filas] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'roles'
           AND COLUMN_NAME = 'superadmin'`
      );
      cacheSuperadmin = Number(filas[0].total) > 0;
    } catch {
      cacheSuperadmin = false;
    }
  }
  return cacheSuperadmin;
}

async function esquemaConRolesMultiples() {
  try {
    const [filas] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('roles', 'usuario_roles')`
    );
    return Number(filas[0].total) === 2;
  } catch {
    return false;
  }
}

// Repository Pattern: única capa que toca SQL de roles. Recibe y devuelve
// filas simples; la lógica de negocio vive en los servicios.
class RolRepository {
  // `listar` acepta sortBy/sortDir opcionales (whitelist) para que la tabla
  // de roles use el mismo componente de cabecera ordenable que Usuarios. Sin
  // sortBy se conserva el orden por defecto (superadmin/acceso total primero).
  async listar({ estado = 'todos', sortBy, sortDir } = {}) {
    if (!(await esquemaConRolesMultiples())) return [];
    const conSuperadmin = await esquemaConSuperadmin();

    const seleccion = conSuperadmin
      ? 'r.id, r.nombre, r.descripcion, r.superadmin, r.acceso_total, r.activo, r.creado_en'
      : 'r.id, r.nombre, r.descripcion, r.acceso_total, r.activo, r.creado_en';
    const ordenPorDefecto = conSuperadmin
      ? 'r.superadmin DESC, r.nombre ASC'
      : 'r.acceso_total DESC, r.nombre ASC';
    const columnaOrden = COLUMNAS_ORDENABLES[sortBy];
    const ordenSql = columnaOrden
      ? `${columnaOrden} ${String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`
      : ordenPorDefecto;

    const where = [];
    const params = [];
    if (estado === 'activo') where.push('r.activo = 1');
    else if (estado === 'inactivo') where.push('r.activo = 0');

    const sql = `
      SELECT ${seleccion}, COUNT(DISTINCT ur.usuario_id) AS numero_usuarios
      FROM roles r
      LEFT JOIN usuario_roles ur ON ur.rol_id = r.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY r.id
      ORDER BY ${ordenSql}`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async buscarPorId(id) {
    const conSuperadmin = await esquemaConSuperadmin();
    const seleccion = conSuperadmin
      ? 'id, nombre, descripcion, superadmin, acceso_total, activo, creado_en'
      : 'id, nombre, descripcion, acceso_total, activo, creado_en';
    const [rows] = await pool.query(`SELECT ${seleccion} FROM roles WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async buscarPorNombre(nombre, excluirId = null) {
    const sql = 'SELECT id FROM roles WHERE nombre = ?';
    const params = [nombre];
    if (excluirId) {
      params.push(excluirId);
      return pool.query(`${sql} AND id <> ? LIMIT 1`, params).then(([rows]) => rows[0] || null);
    }
    return pool.query(`${sql} LIMIT 1`, params).then(([rows]) => rows[0] || null);
  }

  // Devuelve los roles válidos (existentes y activos) para un conjunto de ids.
  async buscarPorIdsActivos(ids) {
    if (!ids || ids.length === 0) return [];
    const conSuperadmin = await esquemaConSuperadmin();
    const seleccion = conSuperadmin
      ? 'id, nombre, superadmin, acceso_total'
      : 'id, nombre, acceso_total';
    const [rows] = await pool.query(
      `SELECT ${seleccion} FROM roles WHERE id IN (?) AND activo = 1`,
      [ids]
    );
    return rows;
  }

  async crear({ nombre, descripcion, superadmin, activo }) {
    const conSuperadmin = await esquemaConSuperadmin();
    const paramsBase = [nombre, descripcion, superadmin, activo];
    const sql = conSuperadmin
      ? 'INSERT INTO roles (nombre, descripcion, superadmin, acceso_total, activo) VALUES (?, ?, ?, ?, ?)'
      : 'INSERT INTO roles (nombre, descripcion, acceso_total, activo) VALUES (?, ?, ?, ?)';
    const params = conSuperadmin
      ? [nombre, descripcion, superadmin, superadmin, activo]
      : paramsBase;
    const [result] = await pool.query(sql, params);
    return result.insertId;
  }

  async actualizar(id, { nombre, descripcion, superadmin, activo }) {
    const conSuperadmin = await esquemaConSuperadmin();
    if (conSuperadmin) {
      await pool.query(
        `UPDATE roles SET nombre = ?, descripcion = ?, superadmin = ?,
           acceso_total = ?, activo = ? WHERE id = ?`,
        [nombre, descripcion, superadmin, superadmin, activo, id]
      );
    } else {
      await pool.query(
        `UPDATE roles SET nombre = ?, descripcion = ?, acceso_total = ?, activo = ? WHERE id = ?`,
        [nombre, descripcion, superadmin, activo, id]
      );
    }
  }

  async cambiarEstado(id, activo) {
    const [result] = await pool.query('UPDATE roles SET activo = ? WHERE id = ?', [activo, id]);
    return result.affectedRows;
  }

  async eliminar(id) {
    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async contarUsuariosAsignados(rolId) {
    if (!(await esquemaConRolesMultiples())) return 0;
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM usuario_roles WHERE rol_id = ?',
      [rolId]
    );
    return Number(rows[0].total);
  }

  // Roles del usuario (para sesión JWT). Es la consulta que el login ejecuta
  // tras validar credenciales: nunca debe romper el inicio de sesión.
  async buscarRolesDeUsuario(usuarioId) {
    if (!(await esquemaConRolesMultiples())) return [];
    const conSuperadmin = await esquemaConSuperadmin();
    const seleccion = conSuperadmin
      ? 'r.id, r.nombre, r.superadmin, r.acceso_total'
      : 'r.id, r.nombre, r.acceso_total';
    const [rows] = await pool.query(
      `SELECT ${seleccion}
       FROM roles r
       JOIN usuario_roles ur ON ur.rol_id = r.id
       WHERE ur.usuario_id = ?`,
      [usuarioId]
    );
    return rows;
  }
}

module.exports = new RolRepository();