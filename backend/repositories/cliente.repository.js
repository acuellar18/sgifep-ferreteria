const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  nit: 'c.nit',
  nombre: 'c.nombre',
  created_at: 'c.created_at'
};

class ClienteRepository {
  async listar({ q, estado, page = 1, pageSize = 10, sortBy, sortDir } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(c.nit LIKE ? OR c.nombre LIKE ? OR c.correo LIKE ? OR c.telefono LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (estado === 'activo' || estado === 'inactivo') {
      where.push('c.estado = ?');
      params.push(estado);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM clientes c ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'c.nombre';
    const direccionOrden = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const [rows] = await pool.query(
      `SELECT c.id, c.nit, c.nombre, c.telefono, c.correo, c.direccion,
              c.dias_credito, c.limite_credito, c.estado, c.created_at,
              COALESCE(f.saldo_actual, 0) AS saldo_actual,
              COALESCE(f.facturas_pendientes, 0) AS facturas_pendientes
       FROM clientes c
       LEFT JOIN (
         SELECT cliente_id,
                SUM(saldo_pendiente) AS saldo_actual,
                COUNT(*) AS facturas_pendientes
         FROM facturas
         WHERE estado = 'emitida' AND estado_pago IN ('pendiente', 'parcial')
         GROUP BY cliente_id
       ) f ON f.cliente_id = c.id
       ${whereSql}
       ORDER BY ${columnaOrden} ${direccionOrden}, c.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async resumen() {
    const [rows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM clientes WHERE estado = 'activo') AS activos,
         (SELECT COUNT(DISTINCT cliente_id)
            FROM facturas
           WHERE estado = 'emitida' AND estado_pago IN ('pendiente', 'parcial')
             AND saldo_pendiente > 0) AS con_saldo_pendiente,
         (SELECT COALESCE(SUM(saldo_pendiente), 0)
            FROM facturas
           WHERE estado = 'emitida' AND estado_pago IN ('pendiente', 'parcial')) AS total_por_cobrar`
    );
    const fila = rows[0] || {};
    return {
      activos: Number(fila.activos || 0),
      con_saldo_pendiente: Number(fila.con_saldo_pendiente || 0),
      total_por_cobrar: Number(fila.total_por_cobrar || 0)
    };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT c.id, c.nit, c.nombre, c.telefono, c.correo, c.direccion,
              c.dias_credito, c.limite_credito, c.estado, c.created_at,
              COALESCE(f.saldo_actual, 0) AS saldo_actual,
              COALESCE(f.facturas_pendientes, 0) AS facturas_pendientes
       FROM clientes c
       LEFT JOIN (
         SELECT cliente_id,
                SUM(saldo_pendiente) AS saldo_actual,
                COUNT(*) AS facturas_pendientes
         FROM facturas
         WHERE estado = 'emitida' AND estado_pago IN ('pendiente', 'parcial')
         GROUP BY cliente_id
       ) f ON f.cliente_id = c.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async listarFacturasCliente(id) {
    const [rows] = await pool.query(
      `SELECT id, numero, fecha, total, saldo_pendiente AS saldo, estado, estado_pago
       FROM facturas
       WHERE cliente_id = ?
       ORDER BY fecha DESC, id DESC
       LIMIT 100`,
      [id]
    );
    return rows;
  }

  async buscarPorNit(nit, excluirId = null) {
    const params = [nit];
    let sql = 'SELECT id FROM clientes WHERE nit = ?';
    if (excluirId) {
      sql += ' AND id <> ?';
      params.push(excluirId);
    }
    const [rows] = await pool.query(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  }

  async crear(datos) {
    const {
      nit,
      nombre,
      telefono,
      correo,
      direccion,
      dias_credito,
      limite_credito,
      estado
    } = datos;
    const [result] = await pool.query(
      `INSERT INTO clientes
         (nit, nombre, telefono, correo, direccion, dias_credito, limite_credito, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nit, nombre, telefono, correo, direccion, dias_credito, limite_credito, estado]
    );
    return result.insertId;
  }

  async actualizar(id, datos) {
    const {
      nit,
      nombre,
      telefono,
      correo,
      direccion,
      dias_credito,
      limite_credito,
      estado
    } = datos;
    const [result] = await pool.query(
      `UPDATE clientes
       SET nit = ?, nombre = ?, telefono = ?, correo = ?, direccion = ?,
           dias_credito = ?, limite_credito = ?, estado = ?
       WHERE id = ?`,
      [nit, nombre, telefono, correo, direccion, dias_credito, limite_credito, estado, id]
    );
    return result.affectedRows;
  }

  async cambiarEstado(id, estado) {
    const [result] = await pool.query(
      'UPDATE clientes SET estado = ? WHERE id = ?',
      [estado, id]
    );
    return result.affectedRows;
  }
}

module.exports = new ClienteRepository();
