const pool = require('../db');

module.exports = {
  listar({ fechaInicio, fechaFin, conductorId, vehiculoId, estado, page = 1, pageSize = 20, sortBy = 'creado_en', sortDir = 'desc' } = {}) {
    const where = ['1=1'];
    const params = [];
    if (fechaInicio && fechaFin) { where.push('r.fecha BETWEEN ? AND ?'); params.push(fechaInicio, fechaFin); }
    else if (fechaInicio) { where.push('r.fecha >= ?'); params.push(fechaInicio); }
    else if (fechaFin) { where.push('r.fecha <= ?'); params.push(fechaFin); }
    if (conductorId) { where.push('r.conductor_id = ?'); params.push(conductorId); }
    if (vehiculoId) { where.push('r.vehiculo_id = ?'); params.push(vehiculoId); }
    if (estado) { where.push('r.estado = ?'); params.push(estado); }
    const orden = ['creado_en','fecha','estado'].includes(sortBy) ? sortBy : 'creado_en';
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;
    const sql = `SELECT r.*, c.nombre AS conductor_nombre, v.placa AS vehiculo_placa
      FROM rutas r
      LEFT JOIN conductores c ON c.id = r.conductor_id
      LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
      WHERE ${where.join(' AND ')}
      ORDER BY r.${orden} ${dir} LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), offset);
    return pool.query(sql, params);
  },

  contar({ fechaInicio, fechaFin, conductorId, vehiculoId, estado }) {
    const where = ['1=1'];
    const params = [];
    if (fechaInicio && fechaFin) { where.push('r.fecha BETWEEN ? AND ?'); params.push(fechaInicio, fechaFin); }
    else if (fechaInicio) { where.push('r.fecha >= ?'); params.push(fechaInicio); }
    else if (fechaFin) { where.push('r.fecha <= ?'); params.push(fechaFin); }
    if (conductorId) { where.push('r.conductor_id = ?'); params.push(conductorId); }
    if (vehiculoId) { where.push('r.vehiculo_id = ?'); params.push(vehiculoId); }
    if (estado) { where.push('r.estado = ?'); params.push(estado); }
    return pool.query(`SELECT COUNT(*) total FROM rutas r WHERE ${where.join(' AND ')}`, params);
  },

  buscarPorId(id) {
    return pool.query(
      `SELECT r.*, c.nombre AS conductor_nombre, v.placa AS vehiculo_placa, v.descripcion AS vehiculo_descripcion
       FROM rutas r
       LEFT JOIN conductores c ON c.id = r.conductor_id
       LEFT JOIN vehiculos v ON v.id = r.vehiculo_id
       WHERE r.id = ? LIMIT 1`, [id]);
  },

  buscarParadas(rutaId) {
    return pool.query(
      `SELECT rp.*, d.codigo AS despacho_codigo, d.estado AS despacho_estado
       FROM ruta_paradas rp
       JOIN despachos d ON d.id = rp.despacho_id
       WHERE rp.ruta_id = ? ORDER BY rp.orden ASC`, [rutaId]);
  },

  crear(conn, datos) {
    const dest = conn || pool;
    return dest.query(
      `INSERT INTO rutas (codigo, fecha, conductor_id, vehiculo_id, zona, estado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.codigo,
        datos.fecha,
        datos.conductor_id || null,
        datos.vehiculo_id || null,
        datos.zona || null,
        datos.estado || 'planificada',
        datos.usuario_id || null
      ]
    );
  },

  crearParada(conn, datos) {
    const dest = conn || pool;
    return dest.query(
      'INSERT INTO ruta_paradas (ruta_id, despacho_id, orden, estado_parada, observaciones) VALUES (?, ?, ?, ?, ?)',
      [datos.ruta_id, datos.despacho_id, datos.orden || 0, datos.estado_parada || 'pendiente', datos.observaciones || null]
    );
  },

  actualizarEstado(conn, id, estado) {
    const dest = conn || pool;
    return dest.query('UPDATE rutas SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [estado, id]);
  },

  registrarEntrega(conn, paradaId, resultado, horaEntrega, recibidoPor, observaciones, motivoFallo) {
    const dest = conn || pool;
    return dest.query(
      'UPDATE ruta_paradas SET estado_parada = ?, hora_entrega = ?, recibido_por = ?, observaciones = ?, motivo_fallo = ? WHERE id = ?',
      [resultado, horaEntrega || new Date(), recibidoPor || null, observaciones || null, motivoFallo || null, paradaId]
    );
  },

  listarConductores({ q = '', activo = 1 } = {}) {
    const where = ['1=1'];
    const params = [];
    if (q) { where.push('(nombre LIKE ? OR telefono LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    if (activo !== undefined && activo !== '') { where.push('activo = ?'); params.push(Number(activo)); }
    return pool.query(`SELECT * FROM conductores WHERE ${where.join(' AND ')} ORDER BY nombre ASC`, params);
  },

  listarVehiculos({ q = '', activo = 1 } = {}) {
    const where = ['1=1'];
    const params = [];
    if (q) { where.push('(placa LIKE ? OR descripcion LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    if (activo !== undefined && activo !== '') { where.push('activo = ?'); params.push(Number(activo)); }
    return pool.query(`SELECT * FROM vehiculos WHERE ${where.join(' AND ')} ORDER BY placa ASC`, params);
  }
};
