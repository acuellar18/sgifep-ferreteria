const pool = require('../db');

const DIAS_SIN_MOVIMIENTO = 90;

function filtroCategoria(filtros = {}) {
  if (!filtros.categoria) return { sql: '', params: [] };
  return { sql: ' AND p.categoria_id = ?', params: [Number(filtros.categoria)] };
}

function ultimoMovimientoSql() {
  return `LEFT JOIN (
    SELECT producto_id, MAX(creado_en) AS ultimo_movimiento
    FROM movimientos_inventario
    GROUP BY producto_id
  ) um ON um.producto_id = p.id`;
}

class ReporteInventarioRepository {
  async obtenerCategoria(categoriaId) {
    if (!categoriaId) return null;
    const [rows] = await pool.query(
      'SELECT id, nombre FROM categorias WHERE id = ?',
      [categoriaId]
    );
    return rows[0] || null;
  }

  async totales(filtros = {}) {
    const categoria = filtroCategoria(filtros);
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS productos,
         COALESCE(SUM(p.stock_actual), 0) AS unidades,
         COALESCE(SUM(p.stock_actual * p.costo_promedio), 0) AS valor,
         COALESCE(SUM(CASE WHEN p.stock_actual <= p.stock_minimo THEN 1 ELSE 0 END), 0) AS stock_bajo,
         COALESCE(SUM(
           CASE WHEN COALESCE(um.ultimo_movimiento, p.creado_en) < DATE_SUB(NOW(), INTERVAL ? DAY)
                THEN 1 ELSE 0 END
         ), 0) AS sin_movimiento
       FROM productos p
       ${ultimoMovimientoSql()}
       WHERE p.activo = 1 AND p.tipo = 'producto'${categoria.sql}`,
      [DIAS_SIN_MOVIMIENTO, ...categoria.params]
    );
    return rows[0] || {};
  }

  async porCategoria(filtros = {}) {
    const categoria = filtroCategoria(filtros);
    const [rows] = await pool.query(
      `SELECT
         COALESCE(c.id, 0) AS id,
         COALESCE(c.nombre, 'Sin categoría') AS nombre,
         COUNT(*) AS productos,
         COALESCE(SUM(p.stock_actual), 0) AS unidades,
         COALESCE(SUM(p.stock_actual * p.costo_promedio), 0) AS valor
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1 AND p.tipo = 'producto'${categoria.sql}
       GROUP BY c.id, c.nombre
       ORDER BY valor DESC, nombre ASC`,
      categoria.params
    );
    return rows;
  }

  async stockBajo(filtros = {}) {
    const categoria = filtroCategoria(filtros);
    const [rows] = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombre, p.unidad_medida,
         COALESCE(c.nombre, 'Sin categoría') AS categoria_nombre,
         p.stock_actual, p.stock_minimo, p.costo_promedio,
         GREATEST(p.stock_minimo - p.stock_actual, 0) AS faltante,
         (p.stock_actual * p.costo_promedio) AS valor
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.activo = 1 AND p.tipo = 'producto' AND p.stock_actual <= p.stock_minimo${categoria.sql}
       ORDER BY faltante DESC, p.nombre ASC
       LIMIT 200`,
      categoria.params
    );
    return rows;
  }

  async sinMovimiento(filtros = {}) {
    const categoria = filtroCategoria(filtros);
    const [rows] = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombre, p.unidad_medida,
         COALESCE(c.nombre, 'Sin categoría') AS categoria_nombre,
         p.stock_actual, p.costo_promedio,
         (p.stock_actual * p.costo_promedio) AS valor,
         um.ultimo_movimiento,
         DATEDIFF(NOW(), COALESCE(um.ultimo_movimiento, p.creado_en)) AS dias_sin_movimiento
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ${ultimoMovimientoSql()}
       WHERE p.activo = 1 AND p.tipo = 'producto'
         AND COALESCE(um.ultimo_movimiento, p.creado_en) < DATE_SUB(NOW(), INTERVAL ? DAY)${categoria.sql}
       ORDER BY dias_sin_movimiento DESC, p.nombre ASC
       LIMIT 200`,
      [DIAS_SIN_MOVIMIENTO, ...categoria.params]
    );
    return rows;
  }
}

module.exports = { ReporteInventarioRepository, DIAS_SIN_MOVIMIENTO };
