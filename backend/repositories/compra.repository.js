const pool = require('../db');

class CompraRepository {
  async listar({
    q,
    proveedor,
    estado_pago,
    estado,
    startDate,
    endDate,
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
    if (startDate) {
      where.push('c.fecha >= ?');
      params.push(startDate);
    }
    if (endDate) {
      where.push('c.fecha <= ?');
      params.push(endDate);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM compras c
       LEFT JOIN proveedores p ON p.id = c.proveedor_id
       ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnasOrdenables = {
      numero: 'c.numero',
      fecha: 'c.fecha',
      proveedor: 'p.nombre',
      total: 'c.total',
      estado_pago: 'c.estado_pago',
      estado: 'c.estado'
    };
    const columnaOrden = columnasOrdenables[sortBy] || 'c.fecha';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT c.id, c.numero, c.proveedor_id, c.fecha, c.numero_factura, c.serie,
             c.condicion, c.fecha_vencimiento, c.subtotal, c.iva, c.total,
             c.monto_pagado, c.saldo_pendiente, c.estado_pago, c.estado,
             c.orden_compra_id, c.notas, c.usuario_id, c.adjunto_factura,
             c.creado_en, c.actualizado_en, c.anulada_en, c.anulada_por, c.anulacion_motivo,
             p.nombre AS proveedor_nombre,
             p.nit AS proveedor_nit,
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

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.*, p.nombre AS proveedor_nombre, p.nit AS proveedor_nit, p.dias_credito AS proveedor_dias_credito,
              u.nombre AS usuario_nombre
       FROM compras c
       LEFT JOIN proveedores p ON p.id = c.proveedor_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarPorNumeroFactura(proveedorId, numeroFactura, excluirId = null) {
    if (!numeroFactura) return null;
    const params = [proveedorId, numeroFactura];
    let sql = 'SELECT id FROM compras WHERE proveedor_id = ? AND numero_factura = ?';
    if (excluirId) {
      sql += ' AND id <> ?';
      params.push(excluirId);
    }
    sql += ' LIMIT 1';
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  }

  async obtenerDetalles(compraId) {
    const [rows] = await pool.query(
      `SELECT dc.id, dc.compra_id, dc.producto_id, dc.cantidad, dc.costo_unitario, dc.subtotal,
              dc.precio_venta,
              pr.codigo AS producto_codigo, pr.nombre AS producto_nombre, pr.unidad_medida
       FROM detalle_compra dc
       LEFT JOIN productos pr ON pr.id = dc.producto_id
       WHERE dc.compra_id = ?
       ORDER BY dc.id ASC`,
      [compraId]
    );
    return rows;
  }

  async obtenerPagos(compraId) {
    const [rows] = await pool.query(
      `SELECT pc.id, pc.compra_id, pc.fecha, pc.monto, pc.metodo, pc.referencia, pc.notas,
              pc.estado, pc.anulado_en, pc.anulado_por, pc.anulacion_motivo, pc.usuario_id, pc.creado_en,
              u.nombre AS usuario_nombre,
              ua.nombre AS anulado_por_nombre
       FROM pagos_compra pc
       LEFT JOIN usuarios u ON u.id = pc.usuario_id
       LEFT JOIN usuarios ua ON ua.id = pc.anulado_por
       WHERE pc.compra_id = ?
       ORDER BY pc.fecha ASC, pc.id ASC`,
      [compraId]
    );
    return rows;
  }

  async obtenerParaAnular(compraId) {
    const [rows] = await pool.query(
      `SELECT dc.producto_id, dc.cantidad, dc.costo_unitario, pr.tipo AS producto_tipo
       FROM detalle_compra dc
       LEFT JOIN productos pr ON pr.id = dc.producto_id
       WHERE dc.compra_id = ?`,
      [compraId]
    );
    return rows;
  }

  async buscarImpresionPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.numero, c.proveedor_id, c.fecha, c.numero_factura, c.serie,
              c.condicion, c.fecha_vencimiento, c.subtotal, c.iva, c.total,
              c.monto_pagado, c.saldo_pendiente, c.estado_pago, c.estado,
              c.notas, c.creado_en, c.anulada_en, c.anulacion_motivo,
              p.nombre AS proveedor_nombre, p.nit AS proveedor_nit, p.dpi AS proveedor_dpi,
              p.contacto_nombre AS proveedor_contacto, p.telefono AS proveedor_telefono,
              p.telefono2 AS proveedor_telefono2, p.correo AS proveedor_correo,
              p.direccion AS proveedor_direccion, p.dias_credito AS proveedor_dias_credito,
              ua.nombre AS anulada_por_nombre
       FROM compras c
       LEFT JOIN proveedores p ON p.id = c.proveedor_id
       LEFT JOIN usuarios ua ON ua.id = c.anulada_por
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async listarImpresion(filtros = {}, limite = 1000) {
    const where = [];
    const params = [];

    if (filtros.q) {
      where.push('(c.numero LIKE ? OR c.numero_factura LIKE ? OR p.nombre LIKE ?)');
      const like = `%${filtros.q}%`;
      params.push(like, like, like);
    }
    if (filtros.proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(Number(filtros.proveedor));
    }
    if (filtros.estado_pago) {
      where.push('c.estado_pago = ?');
      params.push(filtros.estado_pago);
    }
    if (filtros.estado) {
      where.push('c.estado = ?');
      params.push(filtros.estado);
    }
    if (filtros.startDate || filtros.fechaInicio) {
      where.push('c.fecha >= ?');
      params.push(filtros.startDate || filtros.fechaInicio);
    }
    if (filtros.endDate || filtros.fechaFin) {
      where.push('c.fecha <= ?');
      params.push(filtros.endDate || filtros.fechaFin);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM compras c LEFT JOIN proveedores p ON p.id = c.proveedor_id ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;
    if (total > limite) {
      return { rows: [], total, excedeLimite: true };
    }

    const sql = `
      SELECT c.id, c.numero, c.proveedor_id, c.fecha, c.numero_factura, c.serie,
             c.condicion, c.fecha_vencimiento, c.subtotal, c.iva, c.total,
             c.monto_pagado, c.saldo_pendiente, c.estado_pago, c.estado,
             c.notas, c.creado_en,
             p.nombre AS proveedor_nombre
      FROM compras c
      LEFT JOIN proveedores p ON p.id = c.proveedor_id
      ${whereSql}
      ORDER BY c.fecha ASC, c.id ASC
      LIMIT ?`;
    const [rows] = await pool.query(sql, [...params, limite]);
    return { rows, total, excedeLimite: false };
  }

  async crear(conn, datos) {
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO compras
         (numero, proveedor_id, fecha, numero_factura, serie, condicion, fecha_vencimiento,
          subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, estado,
          orden_compra_id, notas, usuario_id, adjunto_factura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.numero,
        datos.proveedor_id,
        datos.fecha,
        datos.numero_factura || null,
        datos.serie || null,
        datos.condicion,
        datos.fecha_vencimiento || null,
        datos.subtotal,
        datos.iva,
        datos.total,
        datos.monto_pagado,
        datos.saldo_pendiente,
        datos.estado_pago,
        datos.estado,
        datos.orden_compra_id || null,
        datos.notas || null,
        datos.usuario_id,
        datos.adjunto_factura || null
      ]
    );
    return result.insertId;
  }

  async crearDetalles(conn, compraId, detalles) {
    const destino = conn || pool;
    for (const d of detalles) {
      const cantidad = Number(d.cantidad || 0);
      const costoUnitario = Number(d.costo_unitario !== undefined ? d.costo_unitario : d.precio_compra || 0);
      const precioVenta = Number(d.precio_venta || 0);
      const subtotal = Math.round(cantidad * costoUnitario * 100) / 100;
      await destino.query(
        `INSERT INTO detalle_compra (compra_id, producto_id, cantidad, costo_unitario, subtotal, precio_venta)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [compraId, d.producto_id, cantidad, costoUnitario, subtotal, precioVenta]
      );
    }
  }

  async actualizarCabecera(id, datos) {
    const campos = [];
    const valores = [];

    if (datos.fecha !== undefined) { campos.push('fecha = ?'); valores.push(datos.fecha); }
    if (datos.numero_factura !== undefined) { campos.push('numero_factura = ?'); valores.push(datos.numero_factura || null); }
    if (datos.serie !== undefined) { campos.push('serie = ?'); valores.push(datos.serie || null); }
    if (datos.condicion !== undefined) { campos.push('condicion = ?'); valores.push(datos.condicion); }
    if (datos.fecha_vencimiento !== undefined) { campos.push('fecha_vencimiento = ?'); valores.push(datos.fecha_vencimiento || null); }
    if (datos.notas !== undefined) { campos.push('notas = ?'); valores.push(datos.notas || null); }

    if (campos.length === 0) return 0;
    campos.push('actualizado_en = CURRENT_TIMESTAMP');
    valores.push(id);
    const [result] = await pool.query(`UPDATE compras SET ${campos.join(', ')} WHERE id = ?`, valores);
    return result.affectedRows;
  }

  async registrarPago(conn, datos) {
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO pagos_compra (compra_id, fecha, monto, metodo, referencia, notas, usuario_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [
        datos.compra_id,
        datos.fecha,
        datos.monto,
        datos.metodo || 'efectivo',
        datos.referencia || null,
        datos.notas || null,
        datos.usuario_id
      ]
    );
    await this.actualizarSaldos(destino, datos.compra_id);
    return result.insertId;
  }

  async actualizarSaldos(conn, compraId) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT c.total,
              COALESCE(SUM(CASE WHEN pc.estado = 'activo' THEN pc.monto ELSE 0 END), 0) AS pagado
       FROM compras c
       LEFT JOIN pagos_compra pc ON pc.compra_id = c.id
       WHERE c.id = ?
       GROUP BY c.id, c.total`,
      [compraId]
    );
    const compra = rows[0];
    if (!compra) return;
    const total = Number(compra.total || 0);
    const pagado = Number(compra.pagado || 0);
    const saldo = Math.max(0, Math.round((total - pagado) * 100) / 100);
    let estadoPago = 'pendiente';
    if (saldo <= 0 && total > 0) estadoPago = 'pagada';
    else if (pagado > 0) estadoPago = 'parcial';
    await destino.query(
      `UPDATE compras SET monto_pagado = ?, saldo_pendiente = ?, estado_pago = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      [pagado, saldo, estadoPago, compraId]
    );
  }

  async obtenerPagoActivo(pagoId) {
    const [rows] = await pool.query(
      `SELECT pc.*, c.estado AS compra_estado, c.numero AS compra_numero
       FROM pagos_compra pc
       JOIN compras c ON c.id = pc.compra_id
       WHERE pc.id = ? AND pc.estado = 'activo'`,
      [pagoId]
    );
    return rows[0] || null;
  }

  async anularPago(conn, pagoId, usuarioId, motivo) {
    const destino = conn || pool;
    await destino.query(
      `UPDATE pagos_compra
       SET estado = 'anulado', anulado_en = CURRENT_TIMESTAMP, anulado_por = ?, anulacion_motivo = ?
       WHERE id = ?`,
      [usuarioId, motivo || null, pagoId]
    );
  }

  async anular(conn, compraId, usuarioId, motivo) {
    const destino = conn || pool;
    await destino.query(
      `UPDATE compras
       SET estado = 'anulada', anulada_en = CURRENT_TIMESTAMP, anulada_por = ?, anulacion_motivo = ?
       WHERE id = ?`,
      [usuarioId, motivo, compraId]
    );
    await destino.query('UPDATE pagos_compra SET estado = "anulado", anulado_en = CURRENT_TIMESTAMP, anulado_por = ?, anulacion_motivo = ? WHERE compra_id = ? AND estado = "activo"', [usuarioId, motivo, compraId]);
    await this.actualizarSaldos(destino, compraId);
  }

  async actualizarEstadoOrden(conn, ordenId) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT COUNT(*) AS total_lineas,
              COALESCE(SUM(CASE WHEN cantidad_recibida >= cantidad_solicitada THEN 1 ELSE 0 END), 0) AS completas,
              COALESCE(SUM(cantidad_recibida), 0) AS recibidas_total,
              COALESCE(SUM(cantidad_solicitada), 0) AS solicitadas_total
       FROM detalle_orden_compra
       WHERE orden_id = ?`,
      [ordenId]
    );
    const r = rows[0] || {};
    const total = Number(r.total_lineas || 0);
    const completas = Number(r.completas || 0);
    const recibidas = Number(r.recibidas_total || 0);
    const solicitadas = Number(r.solicitadas_total || 0);
    let estado = 'enviada';
    if (solicitadas > 0 && recibidas <= 0) estado = 'enviada';
    else if (solicitadas > 0 && recibidas > 0 && completas < total) estado = 'recibida_parcial';
    else if (total > 0 && completas === total) estado = 'recibida';
    await destino.query('UPDATE ordenes_compra SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [estado, ordenId]);
  }

  async listarResumenPorPagar(proveedorId = null) {
    const where = ["c.estado = 'recibida'", "c.estado_pago IN ('pendiente','parcial')"];
    const params = [];
    if (proveedorId) { where.push('c.proveedor_id = ?'); params.push(proveedorId); }
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(c.saldo_pendiente), 0) AS total FROM compras c WHERE ${where.join(' AND ')}`,
      params
    );
    return Number(rows[0]?.total || 0);
  }

  async listarResumenVencido(proveedorId = null) {
    const where = ["c.estado = 'recibida'", "c.estado_pago IN ('pendiente','parcial')", "c.fecha_vencimiento IS NOT NULL", "c.fecha_vencimiento < CURDATE()"];
    const params = [];
    if (proveedorId) { where.push('c.proveedor_id = ?'); params.push(proveedorId); }
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(c.saldo_pendiente), 0) AS total FROM compras c WHERE ${where.join(' AND ')}`,
      params
    );
    return Number(rows[0]?.total || 0);
  }

  async listarResumenPorVencer(proveedorId = null) {
    const where = ["c.estado = 'recibida'", "c.estado_pago IN ('pendiente','parcial')", "c.fecha_vencimiento IS NOT NULL", "c.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"];
    const params = [];
    if (proveedorId) { where.push('c.proveedor_id = ?'); params.push(proveedorId); }
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(c.saldo_pendiente), 0) AS total FROM compras c WHERE ${where.join(' AND ')}`,
      params
    );
    return Number(rows[0]?.total || 0);
  }
}

module.exports = new CompraRepository();
