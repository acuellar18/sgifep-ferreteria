const pool = require('../db');

const CAMPOS_VENTA = `
  v.id, v.numero, v.caja_id, v.factura_id, v.cliente_id, v.usuario_id,
  v.subtotal, v.iva, v.descuento, v.total, v.metodo_pago,
  v.monto_recibido, v.cambio, v.referencia, v.estado,
  v.anulada_en, v.anulada_por, v.anulacion_motivo, v.observaciones,
  v.creado_en, v.actualizado_en
`;

class PosRepository {
  async buscarProductoPorCodigo(codigo) {
    const [rows] = await pool.query(
      `SELECT id, codigo, codigo_barras, nombre, presentacion, unidad_medida,
              tipo, stock_actual, precio_venta
       FROM productos
       WHERE activo = 1
         AND (codigo_barras = ? OR codigo = ?)
       ORDER BY codigo_barras = ? DESC
       LIMIT 1`,
      [codigo, codigo, codigo]
    );
    return rows[0] || null;
  }

  async buscarProductoParaVenta(conn, id) {
    const [rows] = await conn.query(
      `SELECT id, codigo, codigo_barras, nombre, presentacion, unidad_medida,
              tipo, stock_actual, precio_venta, costo_ultimo, costo_promedio, activo
       FROM productos
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarProductos(q, limite = 12) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, codigo, codigo_barras, nombre, presentacion, unidad_medida,
              tipo, stock_actual, precio_venta
       FROM productos
       WHERE activo = 1
         AND (codigo LIKE ? OR codigo_barras LIKE ? OR nombre LIKE ?)
       ORDER BY
         CASE WHEN codigo_barras = ? OR codigo = ? THEN 0 ELSE 1 END,
         nombre ASC
       LIMIT ?`,
      [like, like, like, q, q, limite]
    );
    return rows;
  }

  async buscarClientePorNit(conn, nit) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, nit, nombre, telefono, correo, direccion, estado
       FROM clientes
       WHERE nit = ?
       LIMIT 1`,
      [nit]
    );
    return rows[0] || null;
  }

  async buscarClientePorId(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, nit, nombre, telefono, correo, direccion, estado
       FROM clientes
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarConsumidorFinal(conn) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, nit, nombre, telefono, correo, direccion, estado
       FROM clientes
       WHERE UPPER(nit) = 'CF'
       LIMIT 1`
    );
    return rows[0] || null;
  }

  async crearCliente(conn, datos) {
    const [result] = await conn.query(
      `INSERT INTO clientes
         (nit, nombre, telefono, correo, direccion, dias_credito, limite_credito, estado)
       VALUES (?, ?, ?, ?, ?, 0, 0, 'activo')`,
      [datos.nit, datos.nombre, datos.telefono, datos.correo, datos.direccion]
    );
    return result.insertId;
  }

  async crearVenta(conn, datos) {
    const [result] = await conn.query(
      `INSERT INTO ventas
         (numero, caja_id, factura_id, cliente_id, usuario_id, subtotal, iva,
          descuento, total, metodo_pago, monto_recibido, cambio, referencia,
          estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completada', ?)`,
      [
        datos.numero,
        datos.caja_id,
        datos.factura_id,
        datos.cliente_id,
        datos.usuario_id,
        datos.subtotal,
        datos.iva,
        datos.descuento,
        datos.total,
        datos.metodo_pago,
        datos.monto_recibido,
        datos.cambio,
        datos.referencia,
        datos.observaciones
      ]
    );
    return result.insertId;
  }

  async crearDetalleVenta(conn, ventaId, detalles) {
    if (!detalles.length) return;
    const valores = detalles.map((detalle) => [
      ventaId,
      detalle.producto_id,
      detalle.producto_codigo,
      detalle.producto_nombre,
      detalle.presentacion,
      detalle.unidad_medida,
      detalle.tipo,
      detalle.cantidad,
      detalle.precio_unitario,
      detalle.descuento,
      detalle.subtotal
    ]);
    await conn.query(
      `INSERT INTO detalle_venta
         (venta_id, producto_id, producto_codigo, producto_nombre, presentacion,
          unidad_medida, tipo, cantidad, precio_unitario, descuento, subtotal)
       VALUES ?`,
      [valores]
    );
  }

  async crearCobro(conn, datos) {
    const [result] = await conn.query(
      `INSERT INTO cobros
         (venta_id, factura_id, cliente_id, usuario_id, caja_id, metodo_pago, monto,
          referencia, notas, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registrado')`,
      [
        datos.venta_id || null,
        datos.factura_id || null,
        datos.cliente_id,
        datos.usuario_id,
        datos.caja_id || null,
        datos.metodo_pago,
        datos.monto,
        datos.referencia || null,
        datos.notas || null
      ]
    );
    return result.insertId;
  }

  async buscarCobroPorId(id, conn = null) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT c.id, c.factura_id, c.venta_id, c.cliente_id, c.usuario_id,
              c.caja_id, c.metodo_pago, c.monto, c.referencia, c.notas,
              c.estado, c.creado_en, u.nombre AS usuario_nombre
       FROM cobros c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarVentaPorId(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT ${CAMPOS_VENTA},
              f.numero AS factura_numero,
              c.nit AS cliente_nit, c.nombre AS cliente_nombre,
              c.telefono AS cliente_telefono, c.correo AS cliente_correo,
              c.direccion AS cliente_direccion,
              u.nombre AS usuario_nombre,
              a.nombre AS anulada_por_nombre,
              sc.fecha_apertura AS caja_fecha_apertura,
              sc.estado AS caja_estado
       FROM ventas v
       LEFT JOIN facturas f ON f.id = v.factura_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN usuarios a ON a.id = v.anulada_por
       LEFT JOIN sesiones_caja sc ON sc.id = v.caja_id
       WHERE v.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarVentaParaActualizar(conn, id) {
    const [rows] = await conn.query(
      `SELECT id, numero, caja_id, factura_id, cliente_id, usuario_id, total,
              metodo_pago, estado, creado_en
       FROM ventas
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  }

  async obtenerDetallesVenta(conn, ventaId) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, venta_id, producto_id, producto_codigo, producto_nombre,
              presentacion, unidad_medida, tipo, cantidad, precio_unitario,
              descuento, subtotal
       FROM detalle_venta
       WHERE venta_id = ?
       ORDER BY id ASC`,
      [ventaId]
    );
    return rows;
  }

  async obtenerDetallesVentaParaDevolucion(conn, ventaId) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT dv.id, dv.venta_id, dv.producto_id, dv.producto_codigo,
              dv.producto_nombre, dv.presentacion, dv.unidad_medida, dv.tipo,
              dv.cantidad, dv.precio_unitario, dv.descuento, dv.subtotal,
              COALESCE((
                SELECT SUM(dd.cantidad)
                FROM detalle_devolucion_venta dd
                WHERE dd.detalle_venta_id = dv.id
              ), 0) AS devuelto
       FROM detalle_venta dv
       WHERE dv.venta_id = ?
       ORDER BY dv.id ASC`,
      [ventaId]
    );
    return rows;
  }

  async crearDevolucion(conn, datos) {
    const [result] = await conn.query(
      `INSERT INTO devoluciones_venta
         (numero, venta_id, factura_id, cliente_id, usuario_id, caja_id, tipo,
          metodo_pago, subtotal, iva, total, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.numero,
        datos.venta_id,
        datos.factura_id || null,
        datos.cliente_id,
        datos.usuario_id,
        datos.caja_id || null,
        datos.tipo,
        datos.metodo_pago,
        datos.subtotal,
        datos.iva,
        datos.total,
        datos.motivo
      ]
    );
    return result.insertId;
  }

  async crearDetalleDevolucion(conn, devolucionId, detalles) {
    if (!detalles.length) return;
    const valores = detalles.map((detalle) => [
      devolucionId,
      detalle.detalle_venta_id,
      detalle.producto_id,
      detalle.producto_codigo,
      detalle.producto_nombre,
      detalle.tipo,
      detalle.cantidad,
      detalle.precio_unitario,
      detalle.descuento,
      detalle.subtotal,
      detalle.costo_unitario
    ]);
    await conn.query(
      `INSERT INTO detalle_devolucion_venta
         (devolucion_id, detalle_venta_id, producto_id, producto_codigo,
          producto_nombre, tipo, cantidad, precio_unitario, descuento,
          subtotal, costo_unitario)
       VALUES ?`,
      [valores]
    );
  }

  async listarDevolucionesVenta(ventaId, conn = null) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT d.id, d.numero, d.venta_id, d.factura_id, d.cliente_id,
              d.usuario_id, d.caja_id, d.tipo, d.metodo_pago, d.subtotal,
              d.iva, d.total, d.motivo, d.creado_en, u.nombre AS usuario_nombre
       FROM devoluciones_venta d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.venta_id = ?
       ORDER BY d.creado_en DESC, d.id DESC`,
      [ventaId]
    );
    return rows;
  }

  async obtenerDetallesDevolucion(devolucionId, conn = null) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, devolucion_id, detalle_venta_id, producto_id,
              producto_codigo, producto_nombre, tipo, cantidad,
              precio_unitario, descuento, subtotal, costo_unitario
       FROM detalle_devolucion_venta
       WHERE devolucion_id = ?
       ORDER BY id ASC`,
      [devolucionId]
    );
    return rows;
  }

  async buscarDevolucionPorId(id, conn = null) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT d.id, d.numero, d.venta_id, d.factura_id, d.cliente_id,
              d.usuario_id, d.caja_id, d.tipo, d.metodo_pago, d.subtotal,
              d.iva, d.total, d.motivo, d.creado_en, u.nombre AS usuario_nombre
       FROM devoluciones_venta d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async listarVentas({
    desde,
    hasta,
    metodo_pago,
    estado,
    caja_id,
    q,
    page = 1,
    pageSize = 10
  } = {}) {
    const where = [];
    const params = [];

    if (desde) {
      where.push('DATE(v.creado_en) >= ?');
      params.push(desde);
    }
    if (hasta) {
      where.push('DATE(v.creado_en) <= ?');
      params.push(hasta);
    }
    if (['efectivo', 'tarjeta', 'transferencia'].includes(metodo_pago)) {
      where.push('v.metodo_pago = ?');
      params.push(metodo_pago);
    }
    if (['completada', 'anulada'].includes(estado)) {
      where.push('v.estado = ?');
      params.push(estado);
    }
    if (caja_id) {
      where.push('v.caja_id = ?');
      params.push(Number(caja_id));
    }
    if (q) {
      where.push(
        '(v.numero LIKE ? OR f.numero LIKE ? OR c.nombre LIKE ? OR c.nit LIKE ?)'
      );
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [conteo] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM ventas v
       LEFT JOIN facturas f ON f.id = v.factura_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       ${whereSql}`,
      params
    );
    const total = Number(conteo[0]?.total || 0);

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const pagina = Math.max(1, Number(page) || 1);
    const offset = (pagina - 1) * limite;

    const [rows] = await pool.query(
      `SELECT ${CAMPOS_VENTA},
              f.numero AS factura_numero,
              c.nit AS cliente_nit, c.nombre AS cliente_nombre,
              u.nombre AS usuario_nombre,
              (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.venta_id = v.id) AS lineas,
              (SELECT COALESCE(SUM(dv.cantidad), 0) FROM detalle_venta dv WHERE dv.venta_id = v.id) AS unidades
       FROM ventas v
       LEFT JOIN facturas f ON f.id = v.factura_id
       LEFT JOIN clientes c ON c.id = v.cliente_id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql}
       ORDER BY v.creado_en DESC, v.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: pagina, pageSize: limite };
  }

  async resumen(fecha) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS ventas_count,
         COALESCE(SUM(total), 0) AS total,
         COALESCE(AVG(total), 0) AS ticket_promedio,
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS tarjeta,
         COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia
       FROM ventas
       WHERE DATE(creado_en) = ? AND estado = 'completada'`,
      [fecha]
    );
    return rows[0] || {};
  }

  async anularVenta(conn, id, usuarioId, motivo) {
    const [result] = await conn.query(
      `UPDATE ventas
       SET estado = 'anulada',
           anulada_en = CURRENT_TIMESTAMP,
           anulada_por = ?,
           anulacion_motivo = ?
       WHERE id = ? AND estado = 'completada'`,
      [usuarioId, motivo, id]
    );
    return result.affectedRows;
  }

  async anularCobro(conn, ventaId, motivo) {
    const [result] = await conn.query(
      `UPDATE cobros
       SET estado = 'anulado',
           anulada_en = CURRENT_TIMESTAMP,
           anulacion_motivo = ?
       WHERE venta_id = ? AND estado = 'registrado'`,
      [motivo, ventaId]
    );
    return result.affectedRows;
  }

  async listarCuentasPorCobrar() {
    const [rows] = await pool.query(
      `SELECT f.id, f.numero, f.cliente_id, f.cliente_nombre, f.cliente_nit,
              f.fecha, f.fecha_vencimiento, f.total, f.monto_pagado,
              f.saldo_pendiente, f.estado_pago,
              DATEDIFF(CURDATE(), f.fecha_vencimiento) AS dias_vencido
       FROM facturas f
       WHERE f.estado = 'emitida'
         AND f.estado_pago IN ('pendiente', 'parcial')
         AND f.saldo_pendiente > 0
       ORDER BY
         CASE WHEN f.fecha_vencimiento IS NOT NULL
                   AND f.fecha_vencimiento < CURDATE() THEN 0 ELSE 1 END,
         f.fecha_vencimiento ASC,
         f.id DESC
       LIMIT 150`
    );
    return rows;
  }

  async resumenCuentasPorCobrar() {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS facturas,
         COALESCE(SUM(saldo_pendiente), 0) AS total,
         COALESCE(SUM(CASE WHEN fecha_vencimiento IS NOT NULL
                            AND fecha_vencimiento < CURDATE()
                           THEN saldo_pendiente ELSE 0 END), 0) AS vencido
       FROM facturas
       WHERE estado = 'emitida'
         AND estado_pago IN ('pendiente', 'parcial')
         AND saldo_pendiente > 0`
    );
    return rows[0] || {};
  }
}

module.exports = new PosRepository();
