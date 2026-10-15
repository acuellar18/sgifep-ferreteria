const pool = require('../db');

class ReporteCompraRepository {
  async resumenCompras(filtros = {}) {
    const where = ["c.estado = 'recibida'"];
    const params = [];

    if (filtros.proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(filtros.proveedor);
    }
    if (filtros.categoria) {
      where.push('p.categoria_id = ?');
      params.push(filtros.categoria);
    }
    if (filtros.startDate) {
      where.push('DATE(c.fecha) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [totales] = await pool.query(
      `SELECT 
        COALESCE(SUM(c.total), 0) AS total_comprado,
        COUNT(*) AS num_compras,
        COALESCE(AVG(c.total), 0) AS promedio_compra,
        COALESCE(SUM(c.saldo_pendiente), 0) AS total_por_pagar
       FROM compras c ${whereSql}`, params);

    return {
      total_comprado: Number(totales[0]?.total_comprado || 0),
      num_compras: Number(totales[0]?.num_compras || 0),
      promedio_compra: Number(totales[0]?.promedio_compra || 0),
      total_por_pagar: Number(totales[0]?.total_por_pagar || 0)
    };
  }

  async comprasPorMes(filtros = {}) {
    const where = ["c.estado = 'recibida'"];
    const params = [];

    if (filtros.proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(filtros.proveedor);
    }
    if (filtros.categoria) {
      where.push('p.categoria_id = ?');
      params.push(filtros.categoria);
    }
    if (filtros.startDate) {
      where.push('DATE(c.fecha) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(c.fecha, '%Y-%m') AS mes,
        COUNT(*) AS cantidad,
        COALESCE(SUM(c.total), 0) AS total
       FROM compras c
       JOIN detalle_compra dc ON dc.compra_id = c.id
       JOIN productos p ON p.id = dc.producto_id
       ${whereSql}
       GROUP BY DATE_FORMAT(c.fecha, '%Y-%m')
       ORDER BY mes ASC`, params);

    return rows.map(r => ({
      mes: r.mes,
      cantidad: Number(r.cantidad),
      total: Number(r.total)
    }));
  }

  async topProveedores(filtros = {}, limite = 5) {
    const where = ["c.estado = 'recibida'"];
    const params = [];

    if (filtros.startDate) {
      where.push('DATE(c.fecha) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        pr.id, pr.nombre,
        COUNT(*) AS num_compras,
        COALESCE(SUM(c.total), 0) AS total_comprado
       FROM compras c
       JOIN proveedores pr ON pr.id = c.proveedor_id
       ${whereSql}
       GROUP BY pr.id, pr.nombre
       ORDER BY total_comprado DESC
       LIMIT ?`, [...params, limite]);

    return rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      num_compras: Number(r.num_compras),
      total_comprado: Number(r.total_comprado)
    }));
  }

  async productosMasComprados(filtros = {}, limite = 10) {
    const where = ["c.estado = 'recibida'"];
    const params = [];

    if (filtros.proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(filtros.proveedor);
    }
    if (filtros.categoria) {
      where.push('p.categoria_id = ?');
      params.push(filtros.categoria);
    }
    if (filtros.startDate) {
      where.push('DATE(c.fecha) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        p.id, p.codigo, p.nombre, p.unidad_medida, cat.nombre AS categoria,
        COALESCE(SUM(dc.cantidad), 0) AS cantidad_total,
        COALESCE(SUM(dc.subtotal), 0) AS total_comprado,
        COALESCE(AVG(dc.costo_unitario), 0) AS costo_promedio
       FROM detalle_compra dc
       JOIN compras c ON c.id = dc.compra_id
       JOIN productos p ON p.id = dc.producto_id
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       ${whereSql}
       GROUP BY p.id, p.codigo, p.nombre, p.unidad_medida, cat.nombre
       ORDER BY cantidad_total DESC
       LIMIT ?`, [...params, limite]);

    return rows.map(r => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      unidad_medida: r.unidad_medida,
      categoria: r.categoria,
      cantidad_total: Number(r.cantidad_total),
      total_comprado: Number(r.total_comprado),
      costo_promedio: Number(r.costo_promedio)
    }));
  }

  async variacionCostoProducto(productoId, filtros = {}) {
    const where = ["dc.compra_id = c.id", "c.estado = 'recibida'", "dc.producto_id = ?"];
    const params = [productoId];

    if (filtros.startDate) {
      where.push('DATE(c.fecha) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        c.fecha, c.numero, dc.cantidad, dc.costo_unitario, dc.subtotal,
        pr.nombre AS proveedor
       FROM detalle_compra dc
       JOIN compras c ON c.id = dc.compra_id
       JOIN proveedores pr ON pr.id = c.proveedor_id
       ${whereSql}
       ORDER BY c.fecha ASC, c.id ASC`, params);

    return rows.map(r => ({
      fecha: r.fecha,
      numero_compra: r.numero,
      proveedor: r.proveedor,
      cantidad: Number(r.cantidad),
      costo_unitario: Number(r.costo_unitario),
      subtotal: Number(r.subtotal)
    }));
  }

  async cuentasPorPagar(filtros = {}) {
    const where = ["c.estado = 'recibida'", "c.estado_pago IN ('pendiente','parcial')"];
    const params = [];

    if (filtros.proveedor) {
      where.push('c.proveedor_id = ?');
      params.push(filtros.proveedor);
    }
    if (filtros.startDate) {
      where.push('DATE(c.fecha_vencimiento) >= ?');
      params.push(filtros.startDate);
    }
    if (filtros.endDate) {
      where.push('DATE(c.fecha_vencimiento) <= ?');
      params.push(filtros.endDate);
    }

    const whereSql = 'WHERE ' + where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT 
        c.id, c.numero, c.fecha, c.fecha_vencimiento, c.total, c.saldo_pendiente,
        c.estado_pago, pr.nombre AS proveedor_nombre, pr.telefono AS proveedor_telefono
       FROM compras c
       JOIN proveedores pr ON pr.id = c.proveedor_id
       ${whereSql}
       ORDER BY c.fecha_vencimiento ASC, c.id ASC`, params);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return rows.map(r => {
      const vencimiento = new Date(r.fecha_vencimiento);
      vencimiento.setHours(0, 0, 0, 0);
      let estado_vencimiento = 'normal';
      if (r.saldo_pendiente <= 0) estado_vencimiento = 'pagada';
      else if (vencimiento < hoy) estado_vencimiento = 'vencida';
      else if (vencimiento.getTime() === hoy.getTime()) estado_vencimiento = 'hoy';
      else {
        const diffDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
        if (diffDias <= 3) estado_vencimiento = 'por_vencer';
      }

      return {
        id: r.id,
        numero: r.numero,
        fecha: r.fecha,
        fecha_vencimiento: r.fecha_vencimiento,
        total: Number(r.total),
        saldo_pendiente: Number(r.saldo_pendiente),
        estado_pago: r.estado_pago,
        proveedor_nombre: r.proveedor_nombre,
        proveedor_telefono: r.proveedor_telefono,
        estado_vencimiento,
        dias_restantes: Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
      };
    });
  }

  async categorias() {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre ASC');
    return rows;
  }
}

module.exports = new ReporteCompraRepository();