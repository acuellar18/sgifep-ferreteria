const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  fecha: 'm.creado_en',
  producto: 'p.nombre',
  tipo: 'm.tipo',
  cantidad: 'm.cantidad',
  motivo: 'm.motivo',
  usuario: 'u.nombre'
};

const ORIGEN_POR_TIPO = {
  entrada: 'ajuste_positivo',
  salida: 'ajuste_negativo',
  ajuste: 'ajuste_manual'
};

function columnasSelect() {
  return `m.id, m.producto_id, p.codigo AS producto_codigo,
          p.nombre AS producto_nombre, p.unidad_medida,
          m.tipo, m.cantidad, m.stock_anterior, m.stock_nuevo, m.saldo_resultante,
          m.motivo, m.referencia, m.observaciones, m.notas,
          m.usuario_id, u.nombre AS usuario_nombre, u.username AS usuario_username,
          m.creado_en`;
}

class MovimientoRepository {
  async listar({
    q,
    tipo,
    fechaDesde,
    fechaHasta,
    usuario,
    page = 1,
    pageSize = 12,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const like = `%${q}%`;
      where.push(
        '(p.nombre LIKE ? OR p.codigo LIKE ? OR p.codigo_barras LIKE ? OR m.referencia LIKE ?)'
      );
      params.push(like, like, like, like);
    }
    if (tipo) {
      where.push('m.tipo = ?');
      params.push(tipo);
    }
    if (fechaDesde) {
      where.push('m.creado_en >= ?');
      params.push(`${fechaDesde} 00:00:00`);
    }
    if (fechaHasta) {
      where.push('m.creado_en < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(`${fechaHasta} 00:00:00`);
    }
    if (usuario) {
      const like = `%${usuario}%`;
      where.push('(u.nombre LIKE ? OR u.username LIKE ? OR CAST(m.usuario_id AS CHAR) LIKE ?)');
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'm.creado_en';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const limite = Math.max(1, Math.min(Number(pageSize) || 12, 200));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const [rows] = await pool.query(
      `SELECT ${columnasSelect()}
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ${whereSql}
       ORDER BY ${columnaOrden} ${direccionOrden}, m.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async resumenMes() {
    const [totalesRows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END), 0) AS entradas,
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE 0 END), 0) AS entradas_unidades,
         COALESCE(SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END), 0) AS salidas,
         COALESCE(SUM(CASE WHEN tipo = 'salida' THEN cantidad ELSE 0 END), 0) AS salidas_unidades,
         COALESCE(SUM(CASE WHEN tipo = 'ajuste' THEN 1 ELSE 0 END), 0) AS ajustes,
         COALESCE(SUM(CASE WHEN tipo = 'ajuste' THEN cantidad ELSE 0 END), 0) AS ajustes_unidades
       FROM movimientos_inventario
       WHERE YEAR(creado_en) = YEAR(CURDATE())
         AND MONTH(creado_en) = MONTH(CURDATE())`
    );

    const [ultimoRows] = await pool.query(
      `SELECT ${columnasSelect()}
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ORDER BY m.creado_en DESC, m.id DESC
       LIMIT 1`
    );

    return {
      totales: totalesRows[0] || {},
      ultimo: ultimoRows[0] || null
    };
  }

  async buscarProducto(id) {
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, tipo, unidad_medida, stock_actual, activo
       FROM productos
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async registrar(datos) {
    const {
      producto_id,
      tipo,
      cantidad,
      motivo,
      referencia,
      observaciones,
      usuario_id
    } = datos;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO movimientos_inventario
           (producto_id, tipo, origen, cantidad, costo_unitario,
            motivo, referencia, observaciones, usuario_id)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [
          producto_id,
          tipo,
          ORIGEN_POR_TIPO[tipo] || 'otro',
          cantidad,
          motivo,
          referencia,
          observaciones,
          usuario_id
        ]
      );

      const [rows] = await conn.query(
        `SELECT ${columnasSelect()}
         FROM movimientos_inventario m
         JOIN productos p ON p.id = m.producto_id
         LEFT JOIN usuarios u ON u.id = m.usuario_id
         WHERE m.id = ?`,
        [result.insertId]
      );

      await conn.commit();
      return rows[0] || null;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new MovimientoRepository();
