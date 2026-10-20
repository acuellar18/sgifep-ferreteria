const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  numero: 'c.numero',
  fecha: 'c.fecha',
  proveedor_nombre: 'p.nombre',
  numero_factura: 'c.numero_factura',
  total: 'c.total',
  estado_pago: 'c.estado_pago',
  estado: 'c.estado',
  creado_en: 'c.creado_en'
};

class CompraRepository {
  async listar({
    q,
    proveedor,
    estado_pago,
    estado,
    startDate,
    endDate,
    fechaInicio,
    fechaFin,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(c.numero LIKE ? OR c.numero_factura LIKE ? OR p.nombre LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(Number(proveedor));
    }
    if (estado_pago) {
      where.push('c.estado_pago = ?');
      params.push(estado_pago);
    }
    if (estado) {
      where.push('c.estado = ?');
      params.push(estado);
    }

    const desde = startDate || fechaInicio;
    const hasta = endDate || fechaFin;
    if (desde) {
      where.push('DATE(c.fecha) >= ?');
      params.push(desde);
    }
    if (hasta) {
      where.push('DATE(c.fecha) <= ?');
      params.push(hasta);
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM compras c LEFT JOIN proveedores p ON p.id = c.proveedor_id ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'c.fecha';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT c.id, c.numero, c.proveedor_id, c.fecha, c.numero_factura, c.condicion,
             c.fecha_vencimiento, c.subtotal, c.iva, c.total, c.monto_pagado, c.saldo_pendiente,
             c.estado_pago, c.estado, c.orden_compra_id, c.notas, c.usuario_id, c.adjunto_factura,
             c.creado_en, c.actualizado_en, c.anulada_en, c.anulada_por, c.anulacion_motivo,
             p.nombre AS proveedor_nombre,
             u.nombre AS usuario_nombre
      FROM compras c
      LEFT JOIN proveedores p ON p.id = c.proveedor_id
      LEFT JOIN usuarios u ON u.id = c.usuario_id
      ${whereSql}
      ORDER BY ${columnaOrden} ${direccionOrden}, c.id DESC
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async listarResumenMes(proveedor_id = null) {
    const where = ["c.estado = 'recibida'"];
    const params = [];
    if (proveedor_id) {
      where.push('c.proveedor_id = ?');
      params.push(proveedor_id);
    }
    where.push('c.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)');
    const whereSql = 'WHERE ' + where.join(' AND ');
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(c.total), 0) AS total FROM compras c ${whereSql}`, params);
    return Number(rows[0]?.total || 0);
  }

  async listarResumenPorPagar(proveedor_id = null) {
    const where = ["c.estado = 'recibida'", "c.estado_pago IN ('pendiente','parcial')"];
    const params = [];
    if (proveedor_id) {
      where.push('c.proveedor_id = ?');
      params.push(proveedor_id);
    }
    const whereSql = 'WHERE ' + where.join(' AND ');
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(c.saldo_pendiente), 0) AS total FROM compras c ${whereSql}`, params);
    return Number(rows[0]?.total || 0);
  }

  async listarResumenSemana(proveedor_id = null) {
    const where = ["c.estado = 'recibida'"];
    const params = [];
    if (proveedor_id) {
      where.push('c.proveedor_id = ?');
      params.push(proveedor_id);
    }
    where.push('c.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    const whereSql = 'WHERE ' + where.join(' AND ');
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM compras c ${whereSql}`, params);
    return Number(rows[0]?.total || 0);
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.numero, c.proveedor_id, c.fecha, c.numero_factura, c.condicion,
              c.fecha_vencimiento, c.subtotal, c.iva, c.total, c.monto_pagado, c.saldo_pendiente,
              c.estado_pago, c.estado, c.orden_compra_id, c.notas, c.usuario_id, c.adjunto_factura,
              c.creado_en, c.actualizado_en, c.anulada_en, c.anulada_por, c.anulacion_motivo,
              p.nombre AS proveedor_nombre,
              u.nombre AS usuario_nombre
       FROM compras c
       LEFT JOIN proveedores p ON p.id = c.proveedor_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ?`, [id]);
    return rows[0] || null;
  }

  async buscarPorNumeroFactura(proveedor_id, numero_factura, excluirId = null) {
    if (!numero_factura) return null;
    let sql = 'SELECT id FROM compras WHERE proveedor_id = ? AND numero_factura = ?';
    const params = [proveedor_id, numero_factura];
    if (excluirId) {
      params.push(excluirId);
      sql += ' AND id <> ?';
    }
    const [rows] = await pool.query(sql + ' LIMIT 1', params);
    return rows[0] || null;
  }

  async crear(conn, datos) {
    const { numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento,
            subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado,
            orden_compra_id, notas, usuario_id, adjunto_factura } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO compras (numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento,
                            subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado,
                            orden_compra_id, notas, usuario_id, adjunto_factura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, proveedor_id, fecha, numero_factura, condicion, fecha_vencimiento,
       subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado,
       orden_compra_id, notas, usuario_id, adjunto_factura]
    );
    return result.insertId;
  }

  async crearDetalles(conn, compraId, detalles) {
    const destino = conn || pool;
    for (const d of detalles) {
      await destino.query(
        `INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [compraId, d.producto_id, d.cantidad, d.costo_unitario, d.cantidad * d.costo_unitario]
      );
    }
  }

  async obtenerDetalles(compraId) {
    const [rows] = await pool.query(
      `SELECT dc.id, dc.compra_id, dc.producto_id, dc.cantidad, dc.costo_unitario, dc.subtotal,
              p.codigo AS producto_codigo, p.nombre AS producto_nombre, p.unidad_medida
       FROM detalle_compra dc
       JOIN productos p ON p.id = dc.producto_id
       WHERE dc.compra_id = ?
       ORDER BY dc.id ASC`, [compraId]);
    return rows;
  }

  async obtenerPagos(compraId) {
    const [rows] = await pool.query(
      `SELECT pp.id, pp.compra_id, pp.fecha, pp.monto, pp.metodo, pp.referencia, pp.notas,
              pp.estado, pp.anulado_en, pp.anulado_por, pp.anulacion_motivo,
              pp.usuario_id, pp.creado_en, u.nombre AS usuario_nombre
       FROM pagos_compra pp
       LEFT JOIN usuarios u ON u.id = pp.usuario_id
       WHERE pp.compra_id = ?
       ORDER BY pp.fecha DESC, pp.id DESC`, [compraId]);
    return rows;
  }

  async anular(conn, compraId, usuarioId, motivo) {
    const destino = conn || pool;
    await destino.query(
      `UPDATE compras
       SET estado = 'anulada', estado_pago = 'pagada', saldo_pendiente = 0,
           anulada_en = CURRENT_TIMESTAMP, anulada_por = ?, anulacion_motivo = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [usuarioId, motivo, compraId]
    );
  }

  async obtenerParaAnular(compraId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.estado, c.estado_pago, c.proveedor_id,
              dc.producto_id, dc.cantidad
       FROM compras c
       JOIN detalle_compra dc ON dc.compra_id = c.id
       WHERE c.id = ?`, [compraId]);
    return rows;
  }

  async registrarPago(conn, datos) {
    const { compra_id, fecha, monto, metodo, referencia, notas, usuario_id } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO pagos_compra (compra_id, fecha, monto, metodo, referencia, notas, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [compra_id, fecha, monto, metodo, referencia, notas, usuario_id]
    );
    return result.insertId;
  }

  async actualizarEstadoOrden(conn, ordenId) {
    const destino = conn || pool;
    // Calcular estado segun cantidad recibida vs solicitada
    await destino.query(
      `UPDATE ordenes_compra oc
       SET estado = CASE
         WHEN NOT EXISTS (SELECT 1 FROM detalle_orden_compra d WHERE d.orden_id = oc.id) THEN 'borrador'
         WHEN (
           SELECT COUNT(*) FROM detalle_orden_compra d
           WHERE d.orden_id = oc.id AND d.cantidad_recibida >= d.cantidad_solicitada
         ) = (
           SELECT COUNT(*) FROM detalle_orden_compra d WHERE d.orden_id = oc.id
         ) THEN 'recibida'
         WHEN (
           SELECT COALESCE(SUM(d.cantidad_recibida), 0)
           FROM detalle_orden_compra d WHERE d.orden_id = oc.id
         ) > 0 THEN 'recibida_parcial'
         ELSE oc.estado END,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE oc.id = ?`, [ordenId]
    );
  }
}

module.exports = new CompraRepository();