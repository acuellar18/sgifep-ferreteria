const pool = require('../db');

const CAMPOS_SESION = `
  id, usuario_id, estado, monto_inicial, fecha_apertura, fecha_cierre,
  ventas_total, ventas_efectivo, ventas_tarjeta, ventas_transferencia,
  ventas_count, cobros_total, cobros_efectivo, cobros_tarjeta,
  cobros_transferencia, cobros_count, devoluciones_total,
  devoluciones_efectivo, devoluciones_tarjeta, devoluciones_transferencia,
  devoluciones_count, efectivo_esperado, monto_contado,
  monto_contado_tarjeta, monto_contado_transferencia, diferencia,
  arqueo_detalle, observaciones, creado_en, actualizado_en
`;

class CajaRepository {
  async buscarAbierta(usuarioId) {
    const [rows] = await pool.query(
      `SELECT ${CAMPOS_SESION}
       FROM sesiones_caja
       WHERE usuario_id = ? AND estado = 'abierta'
       ORDER BY id DESC
       LIMIT 1`,
      [usuarioId]
    );
    return rows[0] || null;
  }

  async buscarAbiertaParaActualizar(conn, usuarioId) {
    const [rows] = await conn.query(
      `SELECT ${CAMPOS_SESION}
       FROM sesiones_caja
       WHERE usuario_id = ? AND estado = 'abierta'
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [usuarioId]
    );
    return rows[0] || null;
  }

  async buscarPorId(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT ${CAMPOS_SESION}
       FROM sesiones_caja
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async crear(usuarioId, montoInicial) {
    const [result] = await pool.query(
      `INSERT INTO sesiones_caja (usuario_id, estado, monto_inicial, fecha_apertura)
       VALUES (?, 'abierta', ?, CURRENT_TIMESTAMP)`,
      [usuarioId, montoInicial]
    );
    return result.insertId;
  }

  async calcularVentas(desde, cajaId = null, conn = null) {
    const destino = conn || pool;
    const params = [];
    let filtroVentas = '';

    if (cajaId) {
      filtroVentas = 'AND v.caja_id = ?';
      params.push(cajaId);
    }
    params.push(desde);

    const [rows] = await destino.query(
      `SELECT
         COUNT(*) AS ventas_count,
         COALESCE(SUM(x.total), 0) AS ventas_total,
         COALESCE(SUM(CASE WHEN x.metodo_pago = 'efectivo' THEN x.total ELSE 0 END), 0) AS ventas_efectivo,
         COALESCE(SUM(CASE WHEN x.metodo_pago = 'tarjeta' THEN x.total ELSE 0 END), 0) AS ventas_tarjeta,
         COALESCE(SUM(CASE WHEN x.metodo_pago = 'transferencia' THEN x.total ELSE 0 END), 0) AS ventas_transferencia
       FROM (
         SELECT v.total, v.metodo_pago
         FROM ventas v
         LEFT JOIN facturas fv ON fv.id = v.factura_id
         WHERE v.estado = 'completada'
           AND (v.factura_id IS NULL OR fv.estado = 'emitida')
           ${filtroVentas}
         UNION ALL
         SELECT f.total, 'efectivo' AS metodo_pago
         FROM facturas f
         WHERE f.estado = 'emitida'
           AND f.condicion = 'contado'
           AND f.creado_en >= ?
           AND NOT EXISTS (SELECT 1 FROM ventas v2 WHERE v2.factura_id = f.id)
       ) x`,
      params
    );

    const fila = rows[0] || {};
    return {
      ventas_count: Number(fila.ventas_count || 0),
      ventas_total: Number(fila.ventas_total || 0),
      ventas_efectivo: Number(fila.ventas_efectivo || 0),
      ventas_tarjeta: Number(fila.ventas_tarjeta || 0),
      ventas_transferencia: Number(fila.ventas_transferencia || 0)
    };
  }

  async calcularCobros(desde, cajaId = null, conn = null) {
    const destino = conn || pool;
    const params = [desde];
    let filtro = '';

    if (cajaId) {
      filtro = 'AND c.caja_id = ?';
      params.push(cajaId);
    }

    const [rows] = await destino.query(
      `SELECT
         COUNT(*) AS cobros_count,
         COALESCE(SUM(c.monto), 0) AS cobros_total,
         COALESCE(SUM(CASE WHEN c.metodo_pago = 'efectivo' THEN c.monto ELSE 0 END), 0) AS cobros_efectivo,
         COALESCE(SUM(CASE WHEN c.metodo_pago = 'tarjeta' THEN c.monto ELSE 0 END), 0) AS cobros_tarjeta,
         COALESCE(SUM(CASE WHEN c.metodo_pago = 'transferencia' THEN c.monto ELSE 0 END), 0) AS cobros_transferencia
       FROM cobros c
       WHERE c.estado = 'registrado'
         AND (c.venta_id IS NULL OR NOT EXISTS (
           SELECT 1 FROM ventas v WHERE v.id = c.venta_id
         ))
         AND c.creado_en >= ?
         ${filtro}`,
      params
    );

    const fila = rows[0] || {};
    return {
      cobros_count: Number(fila.cobros_count || 0),
      cobros_total: Number(fila.cobros_total || 0),
      cobros_efectivo: Number(fila.cobros_efectivo || 0),
      cobros_tarjeta: Number(fila.cobros_tarjeta || 0),
      cobros_transferencia: Number(fila.cobros_transferencia || 0)
    };
  }

  async calcularDevoluciones(desde, cajaId = null, conn = null) {
    const destino = conn || pool;
    const params = [desde];
    let filtro = '';

    if (cajaId) {
      filtro = 'AND d.caja_id = ?';
      params.push(cajaId);
    }

    const [rows] = await destino.query(
      `SELECT
         COUNT(*) AS devoluciones_count,
         COALESCE(SUM(d.total), 0) AS devoluciones_total,
         COALESCE(SUM(CASE WHEN d.metodo_pago = 'efectivo' THEN d.total ELSE 0 END), 0) AS devoluciones_efectivo,
         COALESCE(SUM(CASE WHEN d.metodo_pago = 'tarjeta' THEN d.total ELSE 0 END), 0) AS devoluciones_tarjeta,
         COALESCE(SUM(CASE WHEN d.metodo_pago = 'transferencia' THEN d.total ELSE 0 END), 0) AS devoluciones_transferencia
       FROM devoluciones_venta d
       WHERE d.creado_en >= ?
         ${filtro}`,
      params
    );

    const fila = rows[0] || {};
    return {
      devoluciones_count: Number(fila.devoluciones_count || 0),
      devoluciones_total: Number(fila.devoluciones_total || 0),
      devoluciones_efectivo: Number(fila.devoluciones_efectivo || 0),
      devoluciones_tarjeta: Number(fila.devoluciones_tarjeta || 0),
      devoluciones_transferencia: Number(fila.devoluciones_transferencia || 0)
    };
  }

  async cerrar(conn, id, datos) {
    const destino = conn || pool;
    const {
      ventas_total,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_transferencia,
      ventas_count,
      cobros_total,
      cobros_efectivo,
      cobros_tarjeta,
      cobros_transferencia,
      cobros_count,
      devoluciones_total,
      devoluciones_efectivo,
      devoluciones_tarjeta,
      devoluciones_transferencia,
      devoluciones_count,
      efectivo_esperado,
      monto_contado,
      monto_contado_tarjeta,
      monto_contado_transferencia,
      diferencia,
      arqueo_detalle,
      observaciones
    } = datos;

    const [result] = await destino.query(
      `UPDATE sesiones_caja
       SET estado = 'cerrada',
           fecha_cierre = CURRENT_TIMESTAMP,
           ventas_total = ?,
           ventas_efectivo = ?,
           ventas_tarjeta = ?,
           ventas_transferencia = ?,
           ventas_count = ?,
           cobros_total = ?,
           cobros_efectivo = ?,
           cobros_tarjeta = ?,
           cobros_transferencia = ?,
           cobros_count = ?,
           devoluciones_total = ?,
           devoluciones_efectivo = ?,
           devoluciones_tarjeta = ?,
           devoluciones_transferencia = ?,
           devoluciones_count = ?,
           efectivo_esperado = ?,
           monto_contado = ?,
           monto_contado_tarjeta = ?,
           monto_contado_transferencia = ?,
           diferencia = ?,
           arqueo_detalle = ?,
           observaciones = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ? AND estado = 'abierta'`,
      [
        ventas_total,
        ventas_efectivo,
        ventas_tarjeta,
        ventas_transferencia,
        ventas_count,
        cobros_total,
        cobros_efectivo,
        cobros_tarjeta,
        cobros_transferencia,
        cobros_count,
        devoluciones_total,
        devoluciones_efectivo,
        devoluciones_tarjeta,
        devoluciones_transferencia,
        devoluciones_count,
        efectivo_esperado,
        monto_contado,
        monto_contado_tarjeta,
        monto_contado_transferencia,
        diferencia,
        arqueo_detalle || null,
        observaciones || null,
        id
      ]
    );
    return result.affectedRows;
  }

  async listarHistorial(usuarioId, limite = 25) {
    const cantidad = Math.max(1, Math.min(Number(limite) || 25, 100));
    const [rows] = await pool.query(
      `SELECT ${CAMPOS_SESION}
       FROM sesiones_caja
       WHERE usuario_id = ?
       ORDER BY fecha_apertura DESC, id DESC
       LIMIT ?`,
      [usuarioId, cantidad]
    );
    return rows;
  }
}

module.exports = new CajaRepository();
