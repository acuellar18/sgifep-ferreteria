const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  nombre: 'p.nombre',
  nit: 'p.nit',
  telefono: 'p.telefono',
  correo: 'p.correo',
  creado_en: 'p.creado_en'
};

class ProveedorRepository {
  async listar({
    q,
    estado,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.nit LIKE ? OR p.contacto_nombre LIKE ? OR p.telefono LIKE ? OR p.correo LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }
    if (estado === 'activo') where.push('p.activo = 1');
    else if (estado === 'inactivo') where.push('p.activo = 0');

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [conteoRows] = await pool.query(`SELECT COUNT(*) AS total FROM proveedores p ${whereSql}`, params);
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'p.nombre';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT p.id, p.nombre, p.nit, p.contacto_nombre, p.telefono, p.correo,
             p.direccion, p.dias_credito, p.notas, p.activo, p.creado_en, p.actualizado_en
      FROM proveedores p
      ${whereSql}
      ORDER BY ${columnaOrden} ${direccionOrden}, p.id
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async listarResumen({ q, estado } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.nit LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (estado === 'activo') where.push('p.activo = 1');
    else if (estado === 'inactivo') where.push('p.activo = 0');

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Subquery para saldo pendiente: suma de saldos de compras no anuladas
    const sql = `
      SELECT p.id, p.nombre, p.nit, p.telefono, p.activo,
             COALESCE(SUM(CASE WHEN c.estado = 'recibida' THEN c.saldo_pendiente ELSE 0 END), 0) AS saldo_pendiente
      FROM proveedores p
      LEFT JOIN compras c ON c.proveedor_id = p.id
      ${whereSql}
      GROUP BY p.id, p.nombre, p.nit, p.telefono, p.activo
      ORDER BY p.nombre ASC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo, creado_en, actualizado_en
       FROM proveedores WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async buscarPorNIT(nit, excluirId = null) {
    if (!nit) return null;
    const sql = 'SELECT id FROM proveedores WHERE nit = ?';
    const params = [nit];
    if (excluirId) {
      params.push(excluirId);
      const [rows] = await pool.query(`${sql} AND id <> ? LIMIT 1`, params);
      return rows[0] || null;
    }
    const [rows] = await pool.query(`${sql} LIMIT 1`, params);
    return rows[0] || null;
  }

  async crear(datos) {
    const { nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo } = datos;
    const [result] = await pool.query(
      `INSERT INTO proveedores (nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo ? 1 : 0]
    );
    return result.insertId;
  }

  async actualizar(id, datos) {
    const { nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo } = datos;
    const [result] = await pool.query(
      `UPDATE proveedores
       SET nombre = ?, nit = ?, contacto_nombre = ?, telefono = ?, correo = ?,
           direccion = ?, dias_credito = ?, notas = ?, activo = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nombre, nit, contacto_nombre, telefono, correo, direccion, dias_credito, notas, activo ? 1 : 0, id]
    );
    return result.affectedRows;
  }

  async cambiarEstado(id, activo) {
    const valor = Number(activo);
    if (valor !== 0 && valor !== 1) throw new Error('El campo activo debe ser 0 o 1');
    const [result] = await pool.query(
      'UPDATE proveedores SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [valor, id]
    );
    return result.affectedRows;
  }

  async eliminar(id) {
    // Verificar si tiene compras asociadas
    const [compras] = await pool.query('SELECT COUNT(*) AS total FROM compras WHERE proveedor_id = ?', [id]);
    if (compras[0].total > 0) {
      const err = new Error('No se puede eliminar: el proveedor tiene compras asociadas');
      err.code = 'HAS_COMPRAS';
      throw err;
    }
    const [result] = await pool.query('DELETE FROM proveedores WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async obtenerFicha(id) {
    const proveedor = await this.buscarPorId(id);
    if (!proveedor) return null;

    // Compras del proveedor (no anuladas)
    const [compras] = await pool.query(
      `SELECT id, numero, fecha, total, estado_pago, estado
       FROM compras
       WHERE proveedor_id = ? AND estado = 'recibida'
       ORDER BY fecha DESC, id DESC
       LIMIT 50`, [id]);

    // Productos que surte (producto_proveedor)
    const [productos] = await pool.query(
      `SELECT pp.producto_id, pp.costo_ultimo, pp.es_preferido, p.codigo, p.nombre
       FROM producto_proveedor pp
       JOIN productos p ON p.id = pp.producto_id
       WHERE pp.proveedor_id = ?
       ORDER BY pp.es_preferido DESC, p.nombre ASC`, [id]);

    // Saldos
    const [saldos] = await pool.query(
      `SELECT COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente,
              COALESCE(SUM(total), 0) AS total_compras
       FROM compras
       WHERE proveedor_id = ? AND estado = 'recibida'`, [id]);

    return {
      ...proveedor,
      saldo_pendiente: Number(saldos[0]?.saldo_pendiente || 0),
      total_compras: Number(saldos[0]?.total_compras || 0),
      compras,
      productos
    };
  }

  async actualizarCostoProductoProveedor(producto_id, proveedor_id, costo) {
    await pool.query(
      `INSERT INTO producto_proveedor (producto_id, proveedor_id, costo_ultimo, es_preferido)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE costo_ultimo = ?, actualizado_en = CURRENT_TIMESTAMP`,
      [producto_id, proveedor_id, costo, costo]
    );
  }

  async obtenerProductosProveedor(proveedor_id) {
    const [rows] = await pool.query(
      `SELECT pp.producto_id, pp.costo_ultimo, pp.es_preferido, p.codigo, p.nombre
       FROM producto_proveedor pp
       JOIN productos p ON p.id = pp.producto_id
       WHERE pp.proveedor_id = ?
       ORDER BY pp.es_preferido DESC, p.nombre ASC`, [proveedor_id]);
    return rows;
  }
}

module.exports = new ProveedorRepository();