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
    estadoStock,
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
    const estadoStockNormalizado = String(estadoStock || '').toLowerCase();
    if (estadoStockNormalizado === 'agotado') {
      where.push("p.tipo = 'producto' AND p.activo = 1 AND p.stock_actual <= 0");
    } else if (estadoStockNormalizado === 'bajo' || estadoStockNormalizado === 'stock_bajo') {
      where.push(
        "p.tipo = 'producto' AND p.activo = 1 AND p.stock_minimo > 0 AND p.stock_actual > 0 AND p.stock_actual <= p.stock_minimo"
      );
    } else if (estadoStockNormalizado === 'disponible') {
      where.push(
        "p.tipo = 'producto' AND p.activo = 1 AND p.stock_actual > 0 AND (p.stock_minimo <= 0 OR p.stock_actual > p.stock_minimo)"
      );
    }
    if (stockBajo === 'true' || stockBajo === true) {
      where.push(
        "p.tipo = 'producto' AND p.stock_minimo > 0 AND p.stock_actual > 0 AND p.stock_actual <= p.stock_minimo AND p.activo = 1"
      );
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
             p.proveedor_id, p.tipo, p.presentacion, p.ubicacion, p.unidad_medida, p.stock_actual, p.stock_minimo,
             p.costo_ultimo, p.costo_promedio, p.precio_venta,
             p.imagen, p.imagen_miniatura, p.imagen_mime,
             p.activo, p.creado_en, p.actualizado_en,
             c.nombre AS categoria_nombre,
             pr.nombre AS proveedor_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
      ${whereSql}
      ORDER BY ${columnaOrden} ${direccionOrden}, p.id
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.codigo_barras, p.nombre, p.descripcion, p.categoria_id,
              p.proveedor_id, p.tipo, p.presentacion, p.ubicacion, p.unidad_medida, p.stock_actual, p.stock_minimo,
              p.costo_ultimo, p.costo_promedio, p.precio_venta,
              p.imagen, p.imagen_miniatura, p.imagen_mime,
              p.activo, p.creado_en, p.actualizado_en,
              c.nombre AS categoria_nombre,
              pr.nombre AS proveedor_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
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
      `SELECT id, codigo, nombre, tipo, costo_ultimo, unidad_medida, stock_actual, precio_venta
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
      presentacion,
      ubicacion,
      categoria_id,
      tipo,
      unidad_medida,
      stock_minimo,
      precio_venta,
      activo,
      stock_inicial = 0,
      costo_inicial = 0,
      usuario_id = null,
      proveedor_id = null
    } = datos;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const costoBase = Number(stock_inicial) > 0 ? 0 : Number(costo_inicial || 0);
      const [result] = await conn.query(
        `INSERT INTO productos
           (codigo, codigo_barras, nombre, descripcion, presentacion, ubicacion, categoria_id,
            proveedor_id, tipo, unidad_medida, stock_actual, stock_minimo, costo_ultimo, costo_promedio,
            precio_venta, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          presentacion,
          ubicacion,
          categoria_id,
          proveedor_id,
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
    const campos = [];
    const valores = [];

    if (datos.codigo !== undefined) { campos.push('codigo = ?'); valores.push(datos.codigo); }
    if (datos.codigo_barras !== undefined) { campos.push('codigo_barras = ?'); valores.push(datos.codigo_barras || null); }
    if (datos.nombre !== undefined) { campos.push('nombre = ?'); valores.push(datos.nombre); }
    if (datos.descripcion !== undefined) { campos.push('descripcion = ?'); valores.push(datos.descripcion || null); }
    if (datos.presentacion !== undefined) { campos.push('presentacion = ?'); valores.push(datos.presentacion || null); }
    if (datos.ubicacion !== undefined) { campos.push('ubicacion = ?'); valores.push(datos.ubicacion || null); }
    if (datos.categoria_id !== undefined) { campos.push('categoria_id = ?'); valores.push(datos.categoria_id); }
    if (datos.proveedor_id !== undefined) { campos.push('proveedor_id = ?'); valores.push(datos.proveedor_id); }
    if (datos.tipo !== undefined) { campos.push('tipo = ?'); valores.push(datos.tipo); }
    if (datos.unidad_medida !== undefined) { campos.push('unidad_medida = ?'); valores.push(datos.unidad_medida); }
    if (datos.stock_minimo !== undefined) { campos.push('stock_minimo = ?'); valores.push(datos.stock_minimo); }
    if (datos.precio_venta !== undefined) { campos.push('precio_venta = ?'); valores.push(datos.precio_venta); }
    if (datos.activo !== undefined) { campos.push('activo = ?'); valores.push(datos.activo ? 1 : 0); }

    if (campos.length === 0) return 0;
    campos.push('actualizado_en = CURRENT_TIMESTAMP');
    valores.push(id);
    const [result] = await pool.query(`UPDATE productos SET ${campos.join(', ')} WHERE id = ?`, valores);
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

  async cambiarEstado(id, activo) {
    const [result] = await pool.query('UPDATE productos SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [activo ? 1 : 0, id]);
    return result.affectedRows;
  }

  async resumen() {
    const [totales] = await pool.query(
      `SELECT
         COUNT(*) AS productos,
         COALESCE(SUM(stock_actual), 0) AS unidades,
         COALESCE(SUM(stock_actual * costo_promedio), 0) AS valor,
         COALESCE(SUM(
           CASE WHEN stock_minimo > 0 AND stock_actual > 0 AND stock_actual <= stock_minimo
                THEN 1 ELSE 0 END
         ), 0) AS stock_bajo,
         COALESCE(SUM(CASE WHEN stock_actual <= 0 THEN 1 ELSE 0 END), 0) AS agotados
       FROM productos
       WHERE activo = 1 AND tipo = 'producto'`
    );

    const [stockBajo] = await pool.query(
      `SELECT id, nombre, stock_actual, stock_minimo
       FROM productos
       WHERE activo = 1 AND tipo = 'producto'
         AND stock_minimo > 0 AND stock_actual > 0 AND stock_actual <= stock_minimo
       ORDER BY (stock_minimo - stock_actual) DESC, nombre ASC
       LIMIT 20`
    );

    const [agotados] = await pool.query(
      `SELECT id, nombre, stock_actual, stock_minimo
       FROM productos
       WHERE activo = 1 AND tipo = 'producto'
         AND stock_actual <= 0
       ORDER BY nombre ASC
       LIMIT 20`
    );

    return {
      totales: {
        productos: Number(totales[0]?.productos || 0),
        unidades: Number(totales[0]?.unidades || 0),
        valor: Number(totales[0]?.valor || 0),
        stock_bajo: Number(totales[0]?.stock_bajo || 0),
        agotados: Number(totales[0]?.agotados || 0)
      },
      stockBajo,
      agotados
    };
  }

  async contarDependencias(id) {
    const [mov] = await pool.query('SELECT COUNT(*) AS c, COALESCE(SUM(CASE WHEN origen = "inventario_inicial" THEN 1 ELSE 0 END), 0) AS iniciales FROM movimientos_inventario WHERE producto_id = ?', [id]);
    const [comp] = await pool.query('SELECT COUNT(*) AS c FROM detalle_compra WHERE producto_id = ?', [id]);
    const [ord] = await pool.query('SELECT COUNT(*) AS c FROM detalle_orden_compra WHERE producto_id = ?', [id]);
    const [fac] = await pool.query('SELECT COUNT(*) AS c FROM detalle_factura WHERE producto_id = ?', [id]);
    return {
      movimientos: Number(mov[0]?.c || 0),
      movimientos_iniciales: Number(mov[0]?.iniciales || 0),
      compras: Number(comp[0]?.c || 0),
      ordenes: Number(ord[0]?.c || 0),
      facturas: Number(fac[0]?.c || 0)
    };
  }

  async eliminar(id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async eliminarConInventarioInicial(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('SET @sgifep_reset = 1');
      await conn.query('DELETE FROM movimientos_inventario WHERE producto_id = ? AND origen = "inventario_inicial"', [id]);
      await conn.query('SET @sgifep_reset = NULL');
      const [result] = await conn.query('DELETE FROM productos WHERE id = ?', [id]);
      await conn.commit();
      return result.affectedRows;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async obtenerCategorias() {
    const [rows] = await pool.query('SELECT id, nombre, descripcion, activo FROM categorias WHERE activo = 1 ORDER BY nombre ASC');
    return rows;
  }

  async registrarMovimiento(conn, datos) {
    const destino = conn || pool;
    await destino.query(
      `INSERT INTO movimientos_inventario
         (producto_id, tipo, origen, referencia_tipo, referencia_id, cantidad, costo_unitario, motivo, notas, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.producto_id,
        datos.tipo,
        datos.origen,
        datos.referencia_tipo || null,
        datos.referencia_id || null,
        datos.cantidad,
        datos.costo_unitario || 0,
        datos.motivo || datos.notas || null,
        datos.notas || null,
        datos.usuario_id || null
      ]
    );
  }
}

module.exports = new ProductoRepository();
