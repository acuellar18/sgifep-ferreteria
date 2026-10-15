const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  codigo: 'p.codigo',
  nombre: 'p.nombre',
  categoria_nombre: 'c.nombre',
  stock_actual: 'p.stock_actual',
  precio_venta: 'p.precio_venta',
  creado_en: 'p.creado_en'
};

class ProductoRepository {
  async listar({
    q,
    estado,
    categoria,
    stockBajo,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.codigo LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (estado === 'activo') where.push('p.activo = 1');
    else if (estado === 'inactivo') where.push('p.activo = 0');
    if (categoria) {
      where.push('p.categoria_id = ?');
      params.push(Number(categoria));
    }
    if (stockBajo === 'true' || stockBajo === true) {
      where.push('p.stock_actual <= p.stock_minimo AND p.activo = 1');
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [conteoRows] = await pool.query(`SELECT COUNT(*) AS total FROM productos p ${whereSql}`, params);
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'p.nombre';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT p.id, p.codigo, p.nombre, p.descripcion, p.categoria_id, p.unidad_medida,
             p.stock_actual, p.stock_minimo, p.costo_ultimo, p.costo_promedio, p.precio_venta,
             p.activo, p.creado_en, p.actualizado_en,
             c.nombre AS categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      ${whereSql}
      ORDER BY ${columnaOrden} ${direccionOrden}, p.id
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.descripcion, p.categoria_id, p.unidad_medida,
              p.stock_actual, p.stock_minimo, p.costo_ultimo, p.costo_promedio, p.precio_venta,
              p.activo, p.creado_en, p.actualizado_en,
              c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`, [id]);
    return rows[0] || null;
  }

  async buscarPorCodigo(codigo, excluirId = null) {
    const sql = 'SELECT id FROM productos WHERE codigo = ?';
    const params = [codigo];
    if (excluirId) {
      params.push(excluirId);
      const [rows] = await pool.query(`${sql} AND id <> ? LIMIT 1`, params);
      return rows[0] || null;
    }
    const [rows] = await pool.query(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  }

  async buscarAutocompletar(q, limite = 10) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, costo_ultimo, unidad_medida, stock_actual
       FROM productos
       WHERE activo = 1 AND (codigo LIKE ? OR nombre LIKE ?)
       ORDER BY
         CASE WHEN codigo LIKE ? THEN 0 ELSE 1 END,
         nombre ASC
       LIMIT ?`, [like, like, `${q}%`, limite]);
    return rows;
  }

  async crear(datos) {
    const { codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, precio_venta, activo } = datos;
    const [result] = await pool.query(
      `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, costo_promedio, precio_venta, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, costo_ultimo, precio_venta, activo ? 1 : 0]
    );
    return result.insertId;
  }

  async actualizar(id, datos) {
    const { codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, precio_venta, activo } = datos;
    const [result] = await pool.query(
      `UPDATE productos
       SET codigo = ?, nombre = ?, descripcion = ?, categoria_id = ?, unidad_medida = ?,
           stock_minimo = ?, costo_ultimo = ?, precio_venta = ?, activo = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [codigo, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, costo_ultimo, precio_venta, activo ? 1 : 0, id]
    );
    return result.affectedRows;
  }

  async actualizarStockYCosto(conn, productoId, cantidad, costoNuevo) {
    const destino = conn || pool;
    // Actualiza stock y recalcula costo promedio ponderado
    await destino.query(
      `UPDATE productos
       SET stock_actual = stock_actual + ?,
           costo_ultimo = ?,
           costo_promedio = CASE
             WHEN stock_actual + ? > 0 THEN
               ((stock_actual * costo_promedio) + (? * ?)) / (stock_actual + ?)
             ELSE ? END,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cantidad, costoNuevo, cantidad, cantidad, costoNuevo, cantidad, costoNuevo, productoId]
    );
  }

  async revertirStock(conn, productoId, cantidad) {
    const destino = conn || pool;
    const [rows] = await destino.query('SELECT stock_actual FROM productos WHERE id = ? FOR UPDATE', [productoId]);
    const stockActual = Number(rows[0]?.stock_actual || 0);
    if (stockActual < cantidad) {
      const err = new Error(`Stock insuficiente para revertir: disponible ${stockActual}, requerido ${cantidad}`);
      err.code = 'STOCK_INSUFICIENTE';
      throw err;
    }
    await destino.query(
      `UPDATE productos SET stock_actual = stock_actual - ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      [cantidad, productoId]
    );
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) throw new Error('El campo activo debe ser 0 o 1');
    const [result] = await pool.query(
      'UPDATE productos SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [valor, id]
    );
    return result.affectedRows;
  }

  async eliminar(id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async obtenerCategorias() {
    const [rows] = await pool.query('SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre ASC');
    return rows;
  }
}

module.exports = new ProductoRepository();