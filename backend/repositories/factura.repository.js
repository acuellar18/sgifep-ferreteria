const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  numero: 'f.numero',
  fecha: 'f.fecha',
  cliente_nombre: 'f.cliente_nombre',
  total: 'f.total',
  saldo_pendiente: 'f.saldo_pendiente',
  estado_pago: 'f.estado_pago',
  estado: 'f.estado',
  creado_en: 'f.creado_en'
};

const CAMPOS_FACTURA = `
  f.id, f.numero, f.cliente_id, f.cliente_nombre, f.cliente_nit,
  f.cliente_telefono, f.cliente_correo, f.cliente_direccion,
  f.fecha, f.condicion, f.fecha_vencimiento,
  f.subtotal, f.iva, f.total, f.monto_pagado, f.saldo_pendiente,
  f.estado, f.estado_pago, f.notas, f.usuario_id,
  f.creado_en, f.actualizado_en, f.anulada_en, f.anulada_por,
  f.anulacion_motivo
`;

class FacturaRepository {
  async listar({
    q,
    cliente,
    estado,
    estado_pago,
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
      where.push('(f.numero LIKE ? OR f.cliente_nombre LIKE ? OR f.cliente_nit LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    if (cliente) {
      where.push('f.cliente_id = ?');
      params.push(Number(cliente));
    }
    if (estado === 'emitida' || estado === 'anulada') {
      where.push('f.estado = ?');
      params.push(estado);
    }
    if (['pendiente', 'parcial', 'pagada'].includes(estado_pago)) {
      where.push('f.estado_pago = ?');
      params.push(estado_pago);
      if (estado !== 'anulada') {
        where.push("f.estado = 'emitida'");
      }
    }

    const desde = startDate || fechaInicio;
    const hasta = endDate || fechaFin;
    if (desde) {
      where.push('f.fecha >= ?');
      params.push(desde);
    }
    if (hasta) {
      where.push('f.fecha <= ?');
      params.push(hasta);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM facturas f ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'f.fecha';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const [rows] = await pool.query(
      `SELECT ${CAMPOS_FACTURA},
              u.nombre AS usuario_nombre,
              a.nombre AS anulada_por_nombre
       FROM facturas f
       LEFT JOIN usuarios u ON u.id = f.usuario_id
       LEFT JOIN usuarios a ON a.id = f.anulada_por
       ${whereSql}
       ORDER BY ${columnaOrden} ${direccionOrden}, f.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async resumen() {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND YEAR(f.fecha) = YEAR(CURDATE())
             AND MONTH(f.fecha) = MONTH(CURDATE())
           THEN f.total ELSE 0 END), 0) AS facturado_mes,
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND YEAR(f.fecha) = YEAR(CURDATE())
             AND MONTH(f.fecha) = MONTH(CURDATE())
           THEN 1 ELSE 0 END), 0) AS facturas_mes,
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND YEAR(f.fecha) = YEAR(CURDATE())
             AND MONTH(f.fecha) = MONTH(CURDATE())
           THEN f.monto_pagado ELSE 0 END), 0) AS cobrado_mes,
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND f.estado_pago IN ('pendiente', 'parcial')
           THEN f.saldo_pendiente ELSE 0 END), 0) AS total_por_cobrar,
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND f.estado_pago IN ('pendiente', 'parcial')
             AND f.fecha_vencimiento IS NOT NULL
             AND f.fecha_vencimiento < CURDATE()
           THEN 1 ELSE 0 END), 0) AS facturas_vencidas,
         COALESCE(SUM(CASE WHEN f.estado = 'emitida'
             AND f.estado_pago IN ('pendiente', 'parcial')
             AND f.fecha_vencimiento IS NOT NULL
             AND f.fecha_vencimiento < CURDATE()
           THEN f.saldo_pendiente ELSE 0 END), 0) AS monto_vencido
       FROM facturas f`
    );
    const fila = rows[0] || {};
    return {
      facturado_mes: Number(fila.facturado_mes || 0),
      facturas_mes: Number(fila.facturas_mes || 0),
      cobrado_mes: Number(fila.cobrado_mes || 0),
      total_por_cobrar: Number(fila.total_por_cobrar || 0),
      facturas_vencidas: Number(fila.facturas_vencidas || 0),
      monto_vencido: Number(fila.monto_vencido || 0)
    };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT ${CAMPOS_FACTURA},
              u.nombre AS usuario_nombre,
              a.nombre AS anulada_por_nombre
       FROM facturas f
       LEFT JOIN usuarios u ON u.id = f.usuario_id
       LEFT JOIN usuarios a ON a.id = f.anulada_por
       WHERE f.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarImpresionPorId(id) {
    return this.buscarPorId(id);
  }

  async obtenerDetalles(id) {
    const [rows] = await pool.query(
      `SELECT id, factura_id, producto_id, producto_codigo, producto_nombre,
              unidad_medida, tipo, cantidad, precio_unitario, costo_unitario, subtotal
       FROM detalle_factura
       WHERE factura_id = ?
       ORDER BY id ASC`,
      [id]
    );
    return rows;
  }

  async obtenerParaAnular(id) {
    const [rows] = await pool.query(
      `SELECT d.id, d.producto_id, d.tipo, d.cantidad, d.costo_unitario
       FROM detalle_factura d
       WHERE d.factura_id = ?
       ORDER BY d.id ASC`,
      [id]
    );
    return rows;
  }

  async buscarParaCobro(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT ${CAMPOS_FACTURA}, v.id AS venta_id
       FROM facturas f
       LEFT JOIN ventas v ON v.factura_id = f.id
       WHERE f.id = ?
       FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  }

  async actualizarCobro(conn, id, { monto_pagado, saldo_pendiente, estado_pago }) {
    const [result] = await conn.query(
      `UPDATE facturas
       SET monto_pagado = ?,
           saldo_pendiente = ?,
           estado_pago = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ? AND estado = 'emitida'`,
      [monto_pagado, saldo_pendiente, estado_pago, id]
    );
    return result.affectedRows;
  }

  async actualizarTotalesDevolucion(conn, id, datos) {
    const { subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago } = datos;
    const [result] = await conn.query(
      `UPDATE facturas
       SET subtotal = ?,
           iva = ?,
           total = ?,
           monto_pagado = ?,
           saldo_pendiente = ?,
           estado_pago = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ? AND estado = 'emitida'`,
      [subtotal, iva, total, monto_pagado, saldo_pendiente, estado_pago, id]
    );
    return result.affectedRows;
  }

  async listarCobros(facturaId, conn = null) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT c.id, c.factura_id, c.venta_id, c.cliente_id, c.usuario_id,
              c.caja_id, c.metodo_pago, c.monto, c.referencia, c.notas,
              c.estado, c.creado_en, u.nombre AS usuario_nombre
       FROM cobros c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.factura_id = ?
       ORDER BY c.creado_en ASC, c.id ASC`,
      [facturaId]
    );
    return rows;
  }

  async listarProductos({ q = '', limite = 10 } = {}) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, codigo, codigo_barras, nombre, tipo, unidad_medida,
              stock_actual, precio_venta, costo_ultimo, costo_promedio
       FROM productos
       WHERE activo = 1
         AND (codigo LIKE ? OR codigo_barras LIKE ? OR nombre LIKE ?)
       ORDER BY nombre ASC
       LIMIT ?`,
      [like, like, like, limite]
    );
    return rows;
  }

  async buscarCliente(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, nit, nombre, telefono, correo, direccion,
              dias_credito, limite_credito, estado
       FROM clientes
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async buscarProductoParaFactura(conn, id) {
    const destino = conn || pool;
    const [rows] = await destino.query(
      `SELECT id, codigo, nombre, tipo, unidad_medida, stock_actual,
              precio_venta, costo_ultimo, costo_promedio, activo
       FROM productos
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  }

  async crear(conn, datos) {
    const {
      numero,
      cliente_id,
      cliente_nombre,
      cliente_nit,
      cliente_telefono,
      cliente_correo,
      cliente_direccion,
      fecha,
      condicion,
      fecha_vencimiento,
      subtotal,
      iva,
      total,
      monto_pagado,
      saldo_pendiente,
      estado,
      estado_pago,
      notas,
      usuario_id
    } = datos;

    const [result] = await conn.query(
      `INSERT INTO facturas
         (numero, cliente_id, cliente_nombre, cliente_nit, cliente_telefono,
          cliente_correo, cliente_direccion, fecha, condicion, fecha_vencimiento,
          subtotal, iva, total, monto_pagado, saldo_pendiente, estado, estado_pago,
          notas, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        cliente_id,
        cliente_nombre,
        cliente_nit,
        cliente_telefono,
        cliente_correo,
        cliente_direccion,
        fecha,
        condicion,
        fecha_vencimiento,
        subtotal,
        iva,
        total,
        monto_pagado,
        saldo_pendiente,
        estado,
        estado_pago,
        notas,
        usuario_id
      ]
    );
    return result.insertId;
  }

  async crearDetalles(conn, facturaId, detalles) {
    if (!detalles.length) return;
    const valores = detalles.map((d) => [
      facturaId,
      d.producto_id,
      d.producto_codigo,
      d.producto_nombre,
      d.unidad_medida,
      d.tipo,
      d.cantidad,
      d.precio_unitario,
      d.costo_unitario,
      d.subtotal
    ]);
    await conn.query(
      `INSERT INTO detalle_factura
         (factura_id, producto_id, producto_codigo, producto_nombre, unidad_medida,
          tipo, cantidad, precio_unitario, costo_unitario, subtotal)
       VALUES ?`,
      [valores]
    );
  }

  async anular(conn, id, usuarioId, motivo) {
    const [result] = await conn.query(
      `UPDATE facturas
       SET estado = 'anulada',
           estado_pago = 'pagada',
           saldo_pendiente = 0,
           anulada_en = CURRENT_TIMESTAMP,
           anulada_por = ?,
           anulacion_motivo = ?
       WHERE id = ? AND estado = 'emitida'`,
      [usuarioId, motivo, id]
    );
    return result.affectedRows;
  }
}

module.exports = new FacturaRepository();
