const pool = require('../db');

// Whitelist de columnas ordenables desde la tabla de departamentos (misma
// protección que roles y usuarios: nunca se interpola el sortBy crudo del
// cliente, solo la expresión SQL fija de esta tabla).
const COLUMNAS_ORDENABLES = {
  nombre: 'd.nombre',
  creado_en: 'd.creado_en',
  numero_usuarios: 'numero_usuarios'
};

// Repository Pattern: única capa que toca SQL de departamentos.
class DepartamentoRepository {
  // `listar` acepta sortBy/sortDir opcionales (whitelist) para que la tabla
  // use la misma cabecera ordenable que Usuarios; sin sortBy orden alfabético.
  async listar({ estado = 'todos', sortBy, sortDir } = {}) {
    const where = [];
    const params = [];
    if (estado === 'activo') where.push('d.activo = 1');
    else if (estado === 'inactivo') where.push('d.activo = 0');

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy];
    const ordenSql = columnaOrden
      ? `${columnaOrden} ${String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`
      : 'd.nombre ASC';

    const sql = `
      SELECT d.id, d.nombre, d.descripcion, d.activo, d.creado_en,
             COUNT(u.id) AS numero_usuarios
      FROM departamentos d
      LEFT JOIN usuarios u ON u.departamento_id = d.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY d.id
      ORDER BY ${ordenSql}`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, descripcion, activo, creado_en FROM departamentos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async buscarPorNombre(nombre, excluirId = null) {
    const sql = 'SELECT id FROM departamentos WHERE nombre = ?';
    const params = [nombre];
    if (excluirId) {
      params.push(excluirId);
      return pool.query(`${sql} AND id <> ? LIMIT 1`, params).then(([rows]) => rows[0] || null);
    }
    return pool.query(`${sql} LIMIT 1`, params).then(([rows]) => rows[0] || null);
  }

  async crear({ nombre, descripcion, activo }) {
    const [result] = await pool.query(
      'INSERT INTO departamentos (nombre, descripcion, activo) VALUES (?, ?, ?)',
      [nombre, descripcion, activo]
    );
    return result.insertId;
  }

  async actualizar(id, { nombre, descripcion, activo }) {
    const [result] = await pool.query(
      'UPDATE departamentos SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, activo, id]
    );
    return result.affectedRows;
  }

  async cambiarEstado(id, activo) {
    const [result] = await pool.query('UPDATE departamentos SET activo = ? WHERE id = ?', [activo, id]);
    return result.affectedRows;
  }

  async eliminar(id) {
    const [result] = await pool.query('DELETE FROM departamentos WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async contarUsuarios(departamentoId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE departamento_id = ?',
      [departamentoId]
    );
    return Number(rows[0].total);
  }
}

module.exports = new DepartamentoRepository();