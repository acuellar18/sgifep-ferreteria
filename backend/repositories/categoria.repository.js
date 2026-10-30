const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  codigo: 'c.id',
  nombre: 'c.nombre',
  productos: 'productos',
  creado_en: 'c.creado_en'
};

class CategoriaRepository {
  async listar({ q, estado, page = 1, pageSize = 10, sortBy, sortDir } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(c.nombre LIKE ? OR c.descripcion LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (estado === 'activo') where.push('c.activo = 1');
    else if (estado === 'inactivo') where.push('c.activo = 0');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM categorias c ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'c.id';
    const direccionOrden = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const [rows] = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.activo, c.creado_en,
              COUNT(p.id) AS productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id
       ${whereSql}
       GROUP BY c.id
       ORDER BY ${columnaOrden} ${direccionOrden}, c.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.activo, c.creado_en,
              (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id) AS productos
       FROM categorias c
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarPorNombre(nombre, excluirId = null) {
    const params = [nombre];
    let sql = 'SELECT id FROM categorias WHERE nombre = ?';
    if (excluirId) {
      sql += ' AND id <> ?';
      params.push(excluirId);
    }
    const [rows] = await pool.query(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  }

  async crear(datos) {
    const { nombre, descripcion, activo } = datos;
    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, activo)
       VALUES (?, ?, ?)`,
      [nombre, descripcion, activo ? 1 : 0]
    );
    return result.insertId;
  }

  async actualizar(id, datos) {
    const { nombre, descripcion, activo } = datos;
    const [result] = await pool.query(
      `UPDATE categorias
       SET nombre = ?, descripcion = ?, activo = ?
       WHERE id = ?`,
      [nombre, descripcion, activo ? 1 : 0, id]
    );
    return result.affectedRows;
  }

  async cambiarEstado(id, activo) {
    const [result] = await pool.query(
      'UPDATE categorias SET activo = ? WHERE id = ?',
      [Number(activo), id]
    );
    return result.affectedRows;
  }

  async eliminarSiSinProductos(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [categorias] = await conn.query(
        'SELECT id FROM categorias WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!categorias.length) {
        await conn.rollback();
        return { encontrada: false };
      }

      const [productos] = await conn.query(
        'SELECT id FROM productos WHERE categoria_id = ? LIMIT 1',
        [id]
      );
      if (productos.length) {
        await conn.rollback();
        return { encontrada: true, conProductos: true };
      }

      await conn.query('DELETE FROM categorias WHERE id = ?', [id]);
      await conn.commit();
      return { encontrada: true, eliminada: true };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new CategoriaRepository();
