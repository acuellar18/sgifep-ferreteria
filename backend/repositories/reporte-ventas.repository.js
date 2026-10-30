const pool = require('../db');

function filtrosBase({ desde, hasta, metodo_pago, cajero }) {
  const where = ['DATE(v.creado_en) BETWEEN ? AND ?'];
  const params = [desde, hasta];

  if (['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
    where.push('v.metodo_pago = ?');
    params.push(metodo_pago);
  }
  if (cajero) {
    where.push('v.usuario_id = ?');
    params.push(Number(cajero));
  }
  return { where, params };
}

class ReporteVentasRepository {
  async resumen(filtros) {
    const { where, params } = filtrosBase(filtros);
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS ventas_count,
         COALESCE(SUM(v.total), 0) AS ventas_total,
         COALESCE(AVG(v.total), 0) AS ticket_promedio,
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'tarjeta' THEN v.total ELSE 0 END), 0) AS tarjeta,
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END), 0) AS transferencia
       FROM ventas v
       WHERE v.estado = 'completada' AND ${where.join(' AND ')}`,
      params
    );
    return rows[0] || {};
  }

  async anuladas(filtros) {
    const { where, params } = filtrosBase(filtros);
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS anuladas_count, COALESCE(SUM(v.total), 0) AS anuladas_total
       FROM ventas v
       WHERE v.estado = 'anulada' AND ${where.join(' AND ')}`,
      params
    );
    return rows[0] || {};
  }

  async devoluciones(filtros) {
    const where = ['DATE(d.creado_en) BETWEEN ? AND ?'];
    const params = [filtros.desde, filtros.hasta];
    if (filtros.cajero) {
      where.push('d.usuario_id = ?');
      params.push(Number(filtros.cajero));
    }
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS devoluciones_count,
         COALESCE(SUM(d.total), 0) AS devoluciones_total,
         COALESCE(SUM(CASE WHEN d.metodo_pago = 'efectivo' THEN d.total ELSE 0 END), 0) AS devoluciones_efectivo
       FROM devoluciones_venta d
       WHERE ${where.join(' AND ')}`,
      params
    );
    return rows[0] || {};
  }

  async porDia(filtros) {
    const { where, params } = filtrosBase(filtros);
    const [rows] = await pool.query(
      `SELECT DATE(v.creado_en) AS fecha,
              COUNT(*) AS ventas_count,
              COALESCE(SUM(v.total), 0) AS total,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END), 0) AS efectivo,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'tarjeta' THEN v.total ELSE 0 END), 0) AS tarjeta,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END), 0) AS transferencia
       FROM ventas v
       WHERE v.estado = 'completada' AND ${where.join(' AND ')}
       GROUP BY DATE(v.creado_en)
       ORDER BY fecha ASC`,
      params
    );
    return rows;
  }

  async porMetodo(filtros) {
    const { where, params } = filtrosBase(filtros);
    const [rows] = await pool.query(
      `SELECT v.metodo_pago, COUNT(*) AS ventas_count,
              COALESCE(SUM(v.total), 0) AS total
       FROM ventas v
       WHERE v.estado = 'completada' AND ${where.join(' AND ')}
       GROUP BY v.metodo_pago
       ORDER BY total DESC`,
      params
    );
    return rows;
  }

  async porCajero(filtros) {
    const { where, params } = filtrosBase(filtros);
    const [rows] = await pool.query(
      `SELECT v.usuario_id, COALESCE(u.nombre, CONCAT('Usuario ', v.usuario_id)) AS cajero,
              COUNT(*) AS ventas_count,
              COALESCE(SUM(v.total), 0) AS total
       FROM ventas v
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.estado = 'completada' AND ${where.join(' AND ')}
       GROUP BY v.usuario_id, u.nombre
       ORDER BY total DESC`,
      params
    );
    return rows;
  }

  async topProductos(filtros, limite = 10) {
    const { where, params } = filtrosBase(filtros);
    const cantidad = Math.max(1, Math.min(Number(limite) || 10, 50));
    const [rows] = await pool.query(
      `SELECT dv.producto_id, dv.producto_codigo, dv.producto_nombre,
              SUM(dv.cantidad) AS cantidad,
              COALESCE(SUM(dv.subtotal), 0) AS total
       FROM detalle_venta dv
       INNER JOIN ventas v ON v.id = dv.venta_id
       WHERE v.estado = 'completada' AND ${where.join(' AND ')}
       GROUP BY dv.producto_id, dv.producto_codigo, dv.producto_nombre
       ORDER BY cantidad DESC, total DESC
       LIMIT ?`,
      [...params, cantidad]
    );
    return rows;
  }

  async ultimas(filtros, limite = 20) {
    const { where, params } = filtrosBase(filtros);
    const cantidad = Math.max(1, Math.min(Number(limite) || 20, 100));
    const [rows] = await pool.query(
      `SELECT v.id, v.numero, v.total, v.metodo_pago, v.estado, v.creado_en,
              c.nombre AS cliente_nombre, c.nit AS cliente_nit,
              COALESCE(u.nombre, CONCAT('Usuario ', v.usuario_id)) AS cajero
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE ${where.join(' AND ')}
       ORDER BY v.creado_en DESC, v.id DESC
       LIMIT ?`,
      [...params, cantidad]
    );
    return rows;
  }

  async cajeros() {
    const [rows] = await pool.query(
      `SELECT DISTINCT v.usuario_id, u.nombre
       FROM ventas v
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE u.nombre IS NOT NULL
       ORDER BY u.nombre ASC`
    );
    return rows;
  }
}

module.exports = new ReporteVentasRepository();
