const pool = require('../db');

module.exports = {
  crear(connection, datos) {
    const destino = connection || pool;
    return destino.query(
      `INSERT INTO despachos
        (codigo, venta_id, cliente_id, direccion_entrega, telefono_contacto, fecha_programada, observaciones, estado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.codigo,
        datos.venta_id || null,
        datos.cliente_id || null,
        datos.direccion_entrega || null,
        datos.telefono_contacto || null,
        datos.fecha_programada || null,
        datos.observaciones || null,
        datos.estado || 'pendiente',
        datos.usuario_id || null
      ]
    );
  },

  listar({ q, estado, fechaInicio, fechaFin, clienteId, page = 1, pageSize = 20, sortBy = 'creado_en', sortDir = 'desc' } = {}) {
    const where = ['1=1'];
    const params = [];
    if (q) {
      where.push('(d.codigo LIKE ? OR d.observaciones LIKE ? OR c.nombre LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (estado) { where.push('d.estado = ?'); params.push(estado); }
    if (fechaInicio && fechaFin) { where.push('d.fecha_programada BETWEEN ? AND ?'); params.push(fechaInicio, fechaFin); }
    else if (fechaInicio) { where.push('d.fecha_programada >= ?'); params.push(fechaInicio); }
    else if (fechaFin) { where.push('d.fecha_programada <= ?'); params.push(fechaFin); }
    if (clienteId) { where.push('d.cliente_id = ?'); params.push(clienteId); }

    const orden = ['creado_en', 'fecha_programada', 'estado', 'codigo'].includes(sortBy) ? sortBy : 'creado_en';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const sql = `SELECT d.*, c.nombre AS cliente_nombre, f.numero AS factura_numero
      FROM despachos d
      LEFT JOIN clientes c ON c.id = d.cliente_id
      LEFT JOIN facturas f ON f.id = d.venta_id
      WHERE ${where.join(' AND ')}
      ORDER BY d.${orden} ${dir}
      LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    return pool.query(sql, params);
  },

  contar({ q, estado, fechaInicio, fechaFin, clienteId }) {
    const where = ['1=1'];
    const params = [];
    if (q) { where.push('(d.codigo LIKE ? OR d.observaciones LIKE ? OR c.nombre LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (estado) { where.push('d.estado = ?'); params.push(estado); }
    if (fechaInicio && fechaFin) { where.push('d.fecha_programada BETWEEN ? AND ?'); params.push(fechaInicio, fechaFin); }
    else if (fechaInicio) { where.push('d.fecha_programada >= ?'); params.push(fechaInicio); }
    else if (fechaFin) { where.push('d.fecha_programada <= ?'); params.push(fechaFin); }
    if (clienteId) { where.push('d.cliente_id = ?'); params.push(clienteId); }
    return pool.query(`SELECT COUNT(*) total FROM despachos d LEFT JOIN clientes c ON c.id = d.cliente_id WHERE ${where.join(' AND ')}`, params);
  },

  buscarPorId(id) {
    return pool.query(
      `SELECT d.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
              c.direccion AS cliente_direccion, f.numero AS factura_numero
       FROM despachos d
       LEFT JOIN clientes c ON c.id = d.cliente_id
       LEFT JOIN facturas f ON f.id = d.venta_id
       WHERE d.id = ? LIMIT 1`,
      [id]
    );
  },

  buscarDetalle(despachoId) {
    return pool.query(
      `SELECT dd.*, p.codigo AS producto_codigo, p.nombre AS producto_nombre, p.unidad_medida
       FROM despacho_detalle dd
       JOIN productos p ON p.id = dd.producto_id
       WHERE dd.despacho_id = ?`,
      [despachoId]
    );
  },

  buscarHistorial(despachoId) {
    return pool.query(
      `SELECT h.*, u.username AS usuario_username
       FROM despacho_historial h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE h.despacho_id = ? ORDER BY h.creado_en DESC`,
      [despachoId]
    );
  },

  actualizarEstado(conn, id, nuevoEstado, usuarioId, comentario = '') {
    const destino = conn || pool;
    return destino.query(
      'UPDATE despachos SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoEstado, id]
    );
  },

  registrarHistorial(conn, id, usuarioId, deEstado, aEstado, comentario = '') {
    const destino = conn || pool;
    return destino.query(
      'INSERT INTO despacho_historial (despacho_id, usuario_id, de_estado, a_estado, comentario) VALUES (?, ?, ?, ?, ?)',
      [id, usuarioId || null, deEstado || null, aEstado, comentario || null]
    );
  },

  actualizarFechaEntregado(conn, id, fechaEntregado) {
    const destino = conn || pool;
    return destino.query('UPDATE despachos SET fecha_entregado = ? WHERE id = ?', [fechaEntregado, id]);
  }
};
