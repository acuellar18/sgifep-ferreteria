const pool = require('../db');

const COLUMNAS_ORDENABLES = {
  numero: 'oc.numero',
  fecha: 'oc.fecha',
  proveedor_nombre: 'p.nombre',
  fecha_esperada: 'oc.fecha_esperada',
  estado: 'oc.estado',
  total_estimado: 'oc.total_estimado',
  creado_en: 'oc.creado_en'
};

class OrdenCompraRepository {
  async listar({
    q,
    proveedor,
    estado,
    page = 1,
    pageSize = 10,
    sortBy,
    sortDir
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(oc.numero LIKE ? OR p.nombre LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like);
    }
    if (proveedor) {
      where.push('oc.proveedor_id = ?');
      params.push(Number(proveedor));
    }
    if (estado) {
      where.push('oc.estado = ?');
      params.push(estado);
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [conteoRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM ordenes_compra oc LEFT JOIN proveedores p ON p.id = oc.proveedor_id ${whereSql}`,
      params
    );
    const total = Number(conteoRows[0]?.total) || 0;

    const columnaOrden = COLUMNAS_ORDENABLES[sortBy] || 'oc.fecha';
    const direccionOrden = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limite = Math.max(1, Math.min(Number(pageSize) || 10, 100));
    const paginaActual = Math.max(1, Number(page) || 1);
    const offset = (paginaActual - 1) * limite;

    const sql = `
      SELECT oc.id, oc.numero, oc.proveedor_id, oc.fecha, oc.fecha_esperada, oc.estado,
             oc.notas, oc.subtotal_estimado, oc.iva_estimado, oc.total_estimado,
             oc.usuario_id, oc.creado_en, oc.actualizado_en,
             p.nombre AS proveedor_nombre,
             u.nombre AS usuario_nombre
      FROM ordenes_compra oc
      LEFT JOIN proveedores p ON p.id = oc.proveedor_id
      LEFT JOIN usuarios u ON u.id = oc.usuario_id
      ${whereSql}
      ORDER BY ${columnaOrden} ${direccionOrden}, oc.id DESC
      LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [...params, limite, offset]);
    return { rows, total, page: paginaActual, pageSize: limite };
  }

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT oc.id, oc.numero, oc.proveedor_id, oc.fecha, oc.fecha_esperada, oc.estado,
              oc.notas, oc.subtotal_estimado, oc.iva_estimado, oc.total_estimado,
              oc.usuario_id, oc.creado_en, oc.actualizado_en,
              p.nombre AS proveedor_nombre,
              u.nombre AS usuario_nombre
       FROM ordenes_compra oc
       LEFT JOIN proveedores p ON p.id = oc.proveedor_id
       LEFT JOIN usuarios u ON u.id = oc.usuario_id
       WHERE oc.id = ?`, [id]);
    return rows[0] || null;
  }

  async obtenerDetalles(ordenId) {
    const [rows] = await pool.query(
      `SELECT doc.id, doc.orden_id, doc.producto_id, doc.cantidad_solicitada, doc.cantidad_recibida, doc.costo_estimado,
              p.codigo, p.nombre, p.unidad_medida, p.stock_actual, p.stock_minimo, p.costo_ultimo
       FROM detalle_orden_compra doc
       JOIN productos p ON p.id = doc.producto_id
       WHERE doc.orden_id = ?
       ORDER BY doc.id ASC`, [ordenId]);
    return rows;
  }

  async obtenerSiguienteNumero() {
    const anio = new Date().getFullYear();
    const [rows] = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(numero, 5) AS UNSIGNED)) AS max_num
       FROM ordenes_compra
       WHERE numero LIKE ?`, [`OC-${anio}-%`]);
    const maxNum = Number(rows[0]?.max_num || 0);
    const siguiente = maxNum + 1;
    return `OC-${anio}-${String(siguiente).padStart(6, '0')}`;
  }

  async crear(conn, datos) {
    const { numero, proveedor_id, fecha, fecha_esperada, estado, notas,
            subtotal_estimado, iva_estimado, total_estimado, usuario_id } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `INSERT INTO ordenes_compra (numero, proveedor_id, fecha, fecha_esperada, estado, notas,
                                    subtotal_estimado, iva_estimado, total_estimado, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, proveedor_id, fecha, fecha_esperada, estado, notas, subtotal_estimado, iva_estimado, total_estimado, usuario_id]
    );
    return result.insertId;
  }

  async crearDetalles(conn, ordenId, detalles) {
    const destino = conn || pool;
    for (const d of detalles) {
      await destino.query(
        `INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad_solicitada, cantidad_recibida, costo_estimado)
         VALUES (?, ?, ?, 0, ?)`,
        [ordenId, d.producto_id, d.cantidad, d.costo_estimado]
      );
    }
  }

  async actualizar(conn, id, datos) {
    const { proveedor_id, fecha, fecha_esperada, estado, notas,
            subtotal_estimado, iva_estimado, total_estimado } = datos;
    const destino = conn || pool;
    const [result] = await destino.query(
      `UPDATE ordenes_compra
       SET proveedor_id = ?, fecha = ?, fecha_esperada = ?, estado = ?, notas = ?,
           subtotal_estimado = ?, iva_estimado = ?, total_estimado = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [proveedor_id, fecha, fecha_esperada, estado, notas, subtotal_estimado, iva_estimado, total_estimado, id]
    );
    return result.affectedRows;
  }

  async actualizarDetalles(conn, ordenId, detalles) {
    const destino = conn || pool;
    // Obtener detalles actuales
    const [actuales] = await destino.query('SELECT id, producto_id FROM detalle_orden_compra WHERE orden_id = ?', [ordenId]);
    const actualesMap = new Map(actuales.map(a => [a.producto_id, a.id]));

    // Actualizar o insertar
    for (const d of detalles) {
      const existenteId = actualesMap.get(d.producto_id);
      if (existenteId) {
        await destino.query(
          `UPDATE detalle_orden_compra SET cantidad_solicitada = ?, costo_estimado = ? WHERE id = ?`,
          [d.cantidad, d.costo_estimado, existenteId]
        );
        actualesMap.delete(d.producto_id);
      } else {
        await destino.query(
          `INSERT INTO detalle_orden_compra (orden_id, producto_id, cantidad_solicitada, cantidad_recibida, costo_estimado)
           VALUES (?, ?, ?, 0, ?)`,
          [ordenId, d.producto_id, d.cantidad, d.costo_estimado]
        );
      }
    }
    // Eliminar los que ya no están
    for (const id of actualesMap.values()) {
      await destino.query('DELETE FROM detalle_orden_compra WHERE id = ?', [id]);
    }
  }

  async cambiarEstado(conn, id, estado) {
    const destino = conn || pool;
    const [result] = await destino.query(
      `UPDATE ordenes_compra SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?`,
      [estado, id]
    );
    return result.affectedRows;
  }

  async eliminar(conn, id) {
    const destino = conn || pool;
    await destino.query('DELETE FROM detalle_orden_compra WHERE orden_id = ?', [id]);
    const [result] = await destino.query('DELETE FROM ordenes_compra WHERE id = ?', [id]);
    return result.affectedRows;
  }

  async generarDesdeStockBajo(proveedorId = null) {
    let where = 'p.activo = 1 AND p.stock_actual <= p.stock_minimo';
    const params = [];
    if (proveedorId) {
      where += ' AND pp.proveedor_id = ?';
      params.push(proveedorId);
    }
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.unidad_medida, p.stock_actual, p.stock_minimo,
              p.costo_ultimo, pp.costo_ultimo AS costo_proveedor
       FROM productos p
       LEFT JOIN producto_proveedor pp ON pp.producto_id = p.id AND pp.proveedor_id = ?
       WHERE ${where}
       ORDER BY p.nombre ASC`, [proveedorId || 0, ...params]);
    return rows;
  }
}

module.exports = new OrdenCompraRepository();