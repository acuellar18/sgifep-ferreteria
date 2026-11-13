const pool = require('../db');

const SELECT_LISTA = `
  d.*, c.nombre AS cliente_nombre,
  f.numero AS factura_numero, f.estado_pago AS factura_estado_pago,
  f.condicion AS factura_condicion, f.contra_entrega AS factura_contra_entrega,
  f.saldo_pendiente AS factura_saldo_pendiente,
  CONCAT(TRIM(u.nombre), IF(u.apellido IS NULL OR u.apellido = '', '', CONCAT(' ', TRIM(u.apellido)))) AS responsable_nombre
`;

const JOINS = `
  FROM despachos d
  LEFT JOIN clientes c ON c.id = d.cliente_id
  LEFT JOIN facturas f ON f.id = d.venta_id
  LEFT JOIN usuarios u ON u.id = d.responsable_id
`;

function construirWhere({ q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago }) {
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
  if (responsableId) { where.push('d.responsable_id = ?'); params.push(responsableId); }
  if (tipoVehiculo) { where.push('d.tipo_vehiculo = ?'); params.push(tipoVehiculo); }
  if (estadoPago === 'pagado') { where.push('(f.id IS NULL OR f.estado_pago = ?)'); params.push('pagada'); }
  else if (estadoPago === 'credito') { where.push('(f.contra_entrega = 0 AND f.condicion = ? AND f.estado_pago IN (?, ?))'); params.push('credito', 'pendiente', 'parcial'); }
  else if (estadoPago === 'por_cobrar') { where.push('(f.contra_entrega = 1 AND f.estado_pago IN (?, ?))'); params.push('pendiente', 'parcial'); }
  return { where, params };
}

module.exports = {
  crear(connection, datos) {
    const destino = connection || pool;
    return destino.query(
      `INSERT INTO despachos
        (codigo, venta_id, cliente_id, direccion_entrega, telefono_contacto, fecha_programada,
         observaciones, estado, forma_pago, costo_envio, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.codigo || null,
        datos.venta_id || null,
        datos.cliente_id || null,
        datos.direccion_entrega || null,
        datos.telefono_contacto || null,
        datos.fecha_programada || null,
        datos.observaciones || null,
        datos.estado || 'pendiente',
        datos.forma_pago || 'contado',
        datos.costo_envio || 0,
        datos.usuario_id || null
      ]
    );
  },

  crearDetalle(connection, despachoId, detalles) {
    const destino = connection || pool;
    const filas = detalles.map((d) => [
      despachoId,
      d.producto_id,
      d.cantidad,
      Math.round((Number(d.cantidad || 0) * Number(d.precio_unitario || 0)) * 100) / 100
    ]);
    if (!filas.length) return Promise.resolve();
    return destino.query(
      'INSERT INTO despacho_detalle (despacho_id, producto_id, cantidad, subtotal) VALUES ?',
      [filas]
    );
  },

  listar({ q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago, page = 1, pageSize = 20, sortBy = 'creado_en', sortDir = 'desc' } = {}) {
    const { where, params } = construirWhere({ q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago });

    const orden = ['creado_en', 'fecha_programada', 'estado', 'codigo'].includes(sortBy) ? sortBy : 'creado_en';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const sql = `SELECT ${SELECT_LISTA}
      ${JOINS}
      WHERE ${where.join(' AND ')}
      ORDER BY d.${orden} ${dir}
      LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);

    return pool.query(sql, params);
  },

  contar({ q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago }) {
    const { where, params } = construirWhere({ q, estado, fechaInicio, fechaFin, clienteId, responsableId, tipoVehiculo, estadoPago });
    return pool.query(`SELECT COUNT(*) total ${JOINS} WHERE ${where.join(' AND ')}`, params);
  },

  disponiblesParaRuta({ q = '', excluirDespachoId } = {}) {
    const where = ["d.estado IN ('pendiente', 'asignado')"];
    const params = [];
    if (q) {
      where.push('(d.codigo LIKE ? OR c.nombre LIKE ? OR d.direccion_entrega LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    where.push(`d.id NOT IN (
      SELECT rp.despacho_id FROM ruta_paradas rp
      JOIN rutas r ON r.id = rp.ruta_id
      WHERE r.estado IN ('planificada', 'en_curso')
    )`);
    if (excluirDespachoId) {
      where.push('d.id != ?');
      params.push(excluirDespachoId);
    }
    return pool.query(
      `SELECT d.id, d.codigo, d.estado, d.fecha_programada, d.direccion_entrega,
              c.nombre AS cliente_nombre
       FROM despachos d
       LEFT JOIN clientes c ON c.id = d.cliente_id
       WHERE ${where.join(' AND ')}
       ORDER BY d.fecha_programada IS NULL ASC, d.fecha_programada ASC, d.id DESC
       LIMIT 200`,
      params
    );
  },

  buscarPorId(id) {
    return pool.query(
      `SELECT ${SELECT_LISTA}, c.telefono AS cliente_telefono, c.direccion AS cliente_direccion
       ${JOINS}
       WHERE d.id = ? LIMIT 1`,
      [id]
    );
  },

  buscarPorVenta(facturaId, conn = null) {
    const destino = conn || pool;
    return destino.query(
      `SELECT d.* FROM despachos d WHERE d.venta_id = ? ORDER BY d.id DESC LIMIT 1`,
      [facturaId]
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

  // Usuarios activos para asignar como responsable; primero los de rol reparto.
  listarResponsables() {
    return pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.username,
              EXISTS(
                SELECT 1 FROM usuario_roles ur
                JOIN roles r ON r.id = ur.rol_id
                WHERE ur.usuario_id = u.id AND r.nombre = 'reparto'
              ) AS es_reparto
       FROM usuarios u
       WHERE u.activo = 1
       ORDER BY es_reparto DESC, u.nombre ASC, u.apellido ASC`
    );
  },

  actualizarEstado(conn, id, nuevoEstado, usuarioId, comentario = '') {
    const destino = conn || pool;
    return destino.query(
      'UPDATE despachos SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [nuevoEstado, id]
    );
  },

  asignar(conn, id, { responsable_id, tipo_vehiculo, placa_vehiculo }) {
    const destino = conn || pool;
    return destino.query(
      `UPDATE despachos
       SET responsable_id = ?, tipo_vehiculo = ?, placa_vehiculo = ?,
           fecha_asignacion = CURRENT_TIMESTAMP, estado = 'asignado',
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [responsable_id || null, tipo_vehiculo || null, placa_vehiculo || null, id]
    );
  },

  entregar(conn, id, { recibido_por }) {
    const destino = conn || pool;
    return destino.query(
      `UPDATE despachos
       SET estado = 'entregado', fecha_entregado = CURRENT_TIMESTAMP,
           recibido_por = ?, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [recibido_por || null, id]
    );
  },

  marcarNoEntregado(conn, id) {
    const destino = conn || pool;
    return destino.query(
      'UPDATE despachos SET estado = ? , actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      ['no_entregado', id]
    );
  },

  reprogramar(conn, id, fechaProgramada) {
    const destino = conn || pool;
    return destino.query(
      'UPDATE despachos SET estado = ? , fecha_programada = ?, requiere_revision = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      ['pendiente', fechaProgramada, id]
    );
  },

  marcarParaRevision(conn, id) {
    const destino = conn || pool;
    return destino.query(
      'UPDATE despachos SET requiere_revision = 1, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
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
