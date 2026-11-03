const pool = require('../db');

function filtrarFecha(desde, hasta) {
  const where = [];
  const params = [];
  if (desde) { where.push('DATE(fecha) >= ?'); params.push(desde); }
  if (hasta) { where.push('DATE(fecha) <= ?'); params.push(hasta); }
  return { where, params };
}

function aplicarRango(where, params, desde, hasta, campo = 'fecha') {
  if (desde) { where.push(`DATE(${campo}) >= ?`); params.push(desde); }
  if (hasta) { where.push(`DATE(${campo}) <= ?`); params.push(hasta); }
}

class ReporteGeneralRepository {
  async kpis(desde, hasta) {
    const whereV = ["f.estado = 'emitida'"];
    const paramsV = [];
    aplicarRango(whereV, paramsV, desde, hasta, 'f.creado_en');

    const whereC = ["c.estado = 'recibida'"];
    const paramsC = [];
    aplicarRango(whereC, paramsC, desde, hasta, 'c.fecha');

    const [ventasHoy] = await pool.query(
      `SELECT COALESCE(COUNT(*),0) AS count, COALESCE(SUM(total),0) AS total
       FROM facturas f WHERE f.estado = 'emitida' AND DATE(f.creado_en) = CURDATE()`);

    const [ventasPeriodo] = await pool.query(
      `SELECT COALESCE(COUNT(*),0) AS count, COALESCE(SUM(total),0) AS total
       FROM facturas f WHERE ${whereV.join(' AND ')}`, paramsV);

    const [comprasPeriodo] = await pool.query(
      `SELECT COALESCE(COUNT(*),0) AS count, COALESCE(SUM(total),0) AS total
       FROM compras c WHERE ${whereC.join(' AND ')}`, paramsC);

    const [productos] = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(stock_actual),0) AS stock_total
       FROM productos WHERE activo = 1 AND tipo != 'servicio'`);

    const [stockBajo] = await pool.query(
      `SELECT COUNT(*) AS count FROM productos
       WHERE activo = 1 AND tipo != 'servicio' AND stock_actual <= stock_minimo`);

    const [usuariosActivos] = await pool.query(
      `SELECT COUNT(*) AS count FROM usuarios WHERE activo = 1`);

    const [cuentasPendientes] = await pool.query(
      `SELECT COALESCE(COUNT(*),0) AS count, COALESCE(SUM(saldo_pendiente),0) AS total
       FROM compras WHERE estado = 'recibida' AND estado_pago IN ('pendiente','parcial')`);

    const [utilidadQuery] = await pool.query(
      `SELECT COALESCE(SUM(
        CASE WHEN df.precio_unitario > 0 AND df.costo_unitario > 0
          THEN (df.precio_unitario - df.costo_unitario) * df.cantidad
          ELSE 0 END
       ),0) AS utilidad
       FROM detalle_factura df
       JOIN facturas f ON f.id = df.factura_id
       WHERE f.estado = 'emitida' AND ${whereV.join(' AND ')}`, paramsV);

    return {
      ventas_dia: { count: Number(ventasHoy[0].count), total: Number(ventasHoy[0].total) },
      ventas_mes: { count: Number(ventasPeriodo[0].count), total: Number(ventasPeriodo[0].total) },
      compras_mes: { count: Number(comprasPeriodo[0].count), total: Number(comprasPeriodo[0].total) },
      utilidad_estimada: Number(utilidadQuery[0].utilidad),
      productos_inventario: { total: Number(productos[0].total), stock_total: Number(productos[0].stock_total) },
      stock_bajo: Number(stockBajo[0].count),
      usuarios_activos: Number(usuariosActivos[0].count),
      cuentas_por_pagar: { count: Number(cuentasPendientes[0].count), total: Number(cuentasPendientes[0].total) }
    };
  }

  async ventasVsComprasPorMes(desde, hasta) {
    const whereV = ["f.estado = 'emitida'"];
    const whereC = ["c.estado = 'recibida'"];
    const paramsV = [];
    const paramsC = [];
    aplicarRango(whereV, paramsV, desde, hasta, 'f.creado_en');
    aplicarRango(whereC, paramsC, desde, hasta, 'c.fecha');

    const ventas = await pool.query(
      `SELECT DATE_FORMAT(creado_en,'%Y-%m') AS mes, COALESCE(SUM(total),0) AS total
       FROM facturas f WHERE ${whereV.join(' AND ')}
       GROUP BY mes ORDER BY mes ASC`, paramsV);

    const compras = await pool.query(
      `SELECT DATE_FORMAT(fecha,'%Y-%m') AS mes, COALESCE(SUM(total),0) AS total
       FROM compras c WHERE ${whereC.join(' AND ')}
       GROUP BY mes ORDER BY mes ASC`, paramsC);

    const meses = new Set();
    ventas[0].forEach(v => meses.add(v.mes));
    compras[0].forEach(c => meses.add(c.mes));
    const ventaMap = {};
    ventas[0].forEach(v => { ventaMap[v.mes] = Number(v.total); });
    const compraMap = {};
    compras[0].forEach(c => { compraMap[c.mes] = Number(c.total); });

    return Array.from(meses).sort().map(mes => ({
      mes,
      ventas: ventaMap[mes] || 0,
      compras: compraMap[mes] || 0
    }));
  }

  async topProductosVendidos(desde, hasta, limite = 5) {
    const where = ["f.estado = 'emitida'"];
    const params = [];
    aplicarRango(where, params, desde, hasta, 'f.creado_en');

    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre,
        COALESCE(SUM(df.cantidad),0) AS cantidad,
        COALESCE(SUM(df.subtotal),0) AS total
       FROM detalle_factura df
       JOIN facturas f ON f.id = df.factura_id
       JOIN productos p ON p.id = df.producto_id
       WHERE ${where.join(' AND ')}
       GROUP BY p.id, p.codigo, p.nombre
       ORDER BY cantidad DESC LIMIT ?`, [...params, limite]);

    return rows.map(r => ({
      id: r.id, codigo: r.codigo, nombre: r.nombre,
      cantidad: Number(r.cantidad), total: Number(r.total)
    }));
  }

  async ventasPorVendedor(desde, hasta) {
    const where = ["f.estado = 'emitida'"];
    const params = [];
    aplicarRango(where, params, desde, hasta, 'f.creado_en');

    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, COUNT(*) AS ventas_count, COALESCE(SUM(f.total),0) AS total
       FROM facturas f
       JOIN usuarios u ON u.id = f.usuario_id
       WHERE ${where.join(' AND ')}
       GROUP BY u.id, u.nombre
       ORDER BY total DESC`, params);

    return rows.map(r => ({
      usuario_id: Number(r.id), nombre: r.nombre,
      ventas_count: Number(r.ventas_count), total: Number(r.total)
    }));
  }

  async ventasPorDia(desde, hasta) {
    const where = ["f.estado = 'emitida'"];
    const params = [];
    aplicarRango(where, params, desde, hasta, 'f.creado_en');

    const [rows] = await pool.query(
      `SELECT DATE(f.creado_en) AS fecha,
              COUNT(*) AS facturas_count,
              COALESCE(SUM(f.total),0) AS total,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN f.total ELSE 0 END),0) AS efectivo,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'tarjeta' THEN f.total ELSE 0 END),0) AS tarjeta,
              COALESCE(SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN f.total ELSE 0 END),0) AS transferencia
       FROM facturas f
       LEFT JOIN ventas v ON v.factura_id = f.id
       WHERE ${where.join(' AND ')}
       GROUP BY DATE(f.creado_en)
       ORDER BY fecha ASC`, params);

    return rows.map(r => ({
      fecha: String(r.fecha),
      ventas_count: Number(r.facturas_count || 0),
      total: Number(r.total),
      efectivo: Number(r.efectivo),
      tarjeta: Number(r.tarjeta),
      transferencia: Number(r.transferencia)
    }));
  }

  async inventarioPorCategoria() {
    const [rows] = await pool.query(
      `SELECT cat.id, cat.nombre,
        COUNT(p.id) AS productos_count,
        COALESCE(SUM(p.stock_actual),0) AS stock_total,
        COALESCE(SUM(p.stock_actual * p.costo_promedio),0) AS valor_total
       FROM categorias cat
       LEFT JOIN productos p ON p.categoria_id = cat.id AND p.activo = 1 AND p.tipo != 'servicio'
       WHERE cat.activo = 1
       GROUP BY cat.id, cat.nombre
       ORDER BY stock_total DESC`);

    return rows.map(r => ({
      id: r.id, nombre: r.nombre,
      productos_count: Number(r.productos_count),
      stock_total: Number(r.stock_total),
      valor_total: Number(r.valor_total)
    }));
  }

  async ultimasVentas(desde, hasta, limite = 10) {
    const where = ["f.estado = 'emitida'"];
    const params = [];
    aplicarRango(where, params, desde, hasta, 'f.creado_en');

    const [rows] = await pool.query(
      `SELECT f.id, f.numero, f.total, f.creado_en,
        COALESCE(v.metodo_pago, CASE WHEN f.condicion = 'credito' THEN 'credito' ELSE 'contado' END) AS metodo_pago,
        COALESCE(u.nombre, CONCAT('Usuario ', f.usuario_id)) AS usuario_nombre,
        COALESCE(cl.nombre, 'Consumidor Final') AS cliente_nombre
       FROM facturas f
       LEFT JOIN ventas v ON v.factura_id = f.id
       LEFT JOIN usuarios u ON u.id = f.usuario_id
       LEFT JOIN clientes cl ON cl.id = f.cliente_id
       WHERE ${where.join(' AND ')}
       ORDER BY f.creado_en DESC LIMIT ?`, [...params, limite]);

    return rows.map(r => ({
      id: r.id, numero: r.numero, total: Number(r.total),
      creado_en: r.creado_en, metodo_pago: r.metodo_pago,
      usuario: r.usuario_nombre, cliente: r.cliente_nombre
    }));
  }

  async ultimasCompras(desde, hasta, limite = 10) {
    const where = ["c.estado = 'recibida'"];
    const params = [];
    aplicarRango(where, params, desde, hasta, 'c.fecha');

    const [rows] = await pool.query(
      `SELECT c.id, c.numero, c.total, c.fecha, c.estado_pago,
        pr.nombre AS proveedor_nombre
       FROM compras c
       JOIN proveedores pr ON pr.id = c.proveedor_id
       WHERE ${where.join(' AND ')}
       ORDER BY c.fecha DESC LIMIT ?`, [...params, limite]);

    return rows.map(r => ({
      id: r.id, numero: r.numero, total: Number(r.total),
      fecha: r.fecha, estado_pago: r.estado_pago,
      proveedor: r.proveedor_nombre
    }));
  }

  async productosStockBajo() {
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, stock_actual, stock_minimo, unidad_medida
       FROM productos
       WHERE activo = 1 AND tipo != 'servicio' AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC LIMIT 15`);

    return rows.map(r => ({
      id: r.id, codigo: r.codigo, nombre: r.nombre,
      stock_actual: Number(r.stock_actual),
      stock_minimo: Number(r.stock_minimo),
      unidad_medida: r.unidad_medida
    }));
  }

  async movimientosRecientes(limite = 10) {
    const [rows] = await pool.query(
      `SELECT m.id, m.tipo, m.cantidad, m.motivo, m.creado_en,
        p.nombre AS producto_nombre, p.codigo AS producto_codigo,
        u.nombre AS usuario_nombre
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       JOIN usuarios u ON u.id = m.usuario_id
       ORDER BY m.creado_en DESC LIMIT ?`, [limite]);

    return rows.map(r => ({
      id: r.id, tipo: r.tipo, cantidad: Number(r.cantidad),
      motivo: r.motivo, creado_en: r.creado_en,
      producto: r.producto_nombre, producto_codigo: r.producto_codigo,
      usuario: r.usuario_nombre
    }));
  }
}

module.exports = new ReporteGeneralRepository();