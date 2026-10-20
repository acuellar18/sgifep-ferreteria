const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  codigo: 'p.codigo',
  nombre: 'p.nombre',
  categoria_nombre: 'c.nombre',
  tipo: 'p.tipo',
  stock_actual: 'p.stock_actual',
  precio_venta: 'p.precio_venta',
  creado_en: 'p.creado_en'
};

class ProductoRepository {
  async listar({
    q,
    estado,
    categoria,
    tipo,
    stockBajo,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.codigo LIKE ? OR p.codigo_barras LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (estado === 'activo') where.push('p.activo = 1');
    else if (estado === 'inactivo') where.push('p.activo = 0');
    if (categoria) {
      where.push('p.categoria_id = ?');
      params.push(Number(categoria));
    }
    if (tipo === 'producto' || tipo === 'servicio') {
      where.push('p.tipo = ?');
      params.push(tipo);
    }
    if (stockBajo === 'true' || stockBajo === true) {
      where.push("p.tipo = 'producto' AND p.stock_actual <= p.stock_minimo AND p.activo = 1");
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [conteoRows] = await pool.query(`SELECT COUNT(*) AS total FROM productos p ${whereSql}`, params);
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'p.nombre';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT p.id, p.codigo, p.codigo_barras, p.nombre, p.descripcion, p.categoria_id,
             p.tipo, p.unidad_medida, p.stock_actual, p.stock_minimo,
             p.costo_ultimo, p.costo_promedio, p.precio_venta,
             p.imagen, p.imagen_miniatura, p.imagen_mime,
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
      `SELECT p.id, p.codigo, p.codigo_barras, p.nombre, p.descripcion, p.categoria_id,
              p.tipo, p.unidad_medida, p.stock_actual, p.stock_minimo,
              p.costo_ultimo, p.costo_promedio, p.precio_venta,
              p.imagen, p.imagen_miniatura, p.imagen_mime,
              p.activo, p.creado_en, p.actualizado_en,
              c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = ?`,
      [id]
    );
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

  async buscarPorCodigoBarras(codigoBarras, excluirId = null) {
    if (!codigoBarras) return null;
    const params = [codigoBarras];
    let sql = 'SELECT id FROM productos WHERE codigo_barras = ?';
    if (excluirId) {
      sql += ' AND id <> ?';
      params.push(excluirId);
    }
    const [rows] = await pool.query(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  }

  async buscarAutocompletar(q, limite = 10) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, tipo, costo_ultimo, unidad_medida, stock_actual
       FROM productos
       WHERE activo = 1 AND (codigo LIKE ? OR codigo_barras LIKE ? OR nombre LIKE ?)
       ORDER BY
         CASE WHEN codigo LIKE ? THEN 0 ELSE 1 END,
         nombre ASC
       LIMIT ?`,
      [like, like, like, `${q}%`, limite]
    );
    return rows;
  }

  async crear(datos) {
    const {
      codigo,
      codigo_barras,
      nombre,
      descripcion,
      categoria_id,
      tipo,
      unidad_medida,
      stock_minimo,
      precio_venta,
      activo,
      stock_inicial = 0,
      costo_inicial = 0,
      usuario_id = null
    } = datos;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const costoBase = Number(stock_inicial) > 0 ? 0 : Number(costo_inicial || 0);
      const [result] = await conn.query(
        `INSERT INTO productos
           (codigo, codigo_barras, nombre, descripcion, categoria_id, tipo, unidad_medida,
            stock_actual, stock_minimo, costo_ultimo, costo_promedio, precio_venta, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          categoria_id,
          tipo,
          unidad_medida,
          stock_minimo,
          costoBase,
          costoBase,
          precio_venta,
          activo ? 1 : 0
        ]
      );
      const id = result.insertId;

      if (tipo === 'producto' && Number(stock_inicial) > 0) {
        await this.registrarMovimiento(conn, {
          producto_id: id,
          tipo: 'entrada',
          origen: 'inventario_inicial',
          cantidad: Number(stock_inicial),
          costo_unitario: Number(costo_inicial || 0),
          motivo: 'Inventario inicial',
          notas: 'Creado al registrar el producto',
          usuario_id
        });
      }

      await conn.commit();
      return id;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async actualizar(id, datos) {
    const {
      codigo,
      codigo_barras,
      nombre,
      descripcion,
      categoria_id,
      tipo,
      unidad_medida,
      stock_minimo,
      precio_venta,
      activo
    } = datos;
    const [result] = await pool.query(
      `UPDATE productos
       SET codigo = ?, codigo_barras = ?, nombre = ?, descripcion = ?, categoria_id = ?,
           tipo = ?, unidad_medida = ?, stock_minimo = ?, precio_venta = ?, activo = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        codigo,
        codigo_barras,
        nombre,
        descripcion,
        categoria_id,
        tipo,
        unidad_medida,
        stock_minimo,
        precio_venta,
        activo ? 1 : 0,
        id
      ]
    );
    return result.affectedRows;
  }

  async actualizarImagen(id, datos) {
    const { imagen, imagen_miniatura, imagen_mime } = datos;
    const [result] = await pool.query(
      `UPDATE productos
       SET imagen = ?, imagen_miniatura = ?, imagen_mime = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [imagen, imagen_miniatura, imagen_mime, id]
    );
    return result.affectedRows;
  }

  async registrarMovimiento(conn, datos) {
    const destino = conn || pool;
    const {
      producto_id,
      tipo,
      origen,
      referencia_tipo,
      referencia_id,
      cantidad,
      costo_unitario,
      notas,
      motivo,
      usuario_id
    } = datos;

    const [result] = await destino.query(
      `INSERT INTO movimientos_inventario
        (producto_id, tipo, origen, referencia_tipo, referencia_id, cantidad,
         costo_unitario, notas, motivo, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        producto_id,
        tipo,
        origen,
        referencia_tipo || null,
        referencia_id || null,
        cantidad,
        costo_unitario || 0,
        notas || null,
        motivo || null,
        usuario_id || null
      ]
    );
    return result.insertId;
  }

  async contarDependencias(id) {
    const [rows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM movimientos_inventario WHERE producto_id = ?) AS movimientos,
         (SELECT COUNT(*) FROM detalle_compra WHERE producto_id = ?) AS compras,
         (SELECT COUNT(*) FROM detalle_orden_compra WHERE producto_id = ?) AS ordenes`,
      [id, id, id]
    );
    const fila = rows[0] || {};
    return {
      movimientos: Number(fila.movimientos || 0),
      compras: Number(fila.compras || 0),
      ordenes: Number(fila.ordenes || 0)
    };
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
