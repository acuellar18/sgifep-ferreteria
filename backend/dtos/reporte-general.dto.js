function redondear2(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function validarFecha(valor) {
  if (!valor) return '';
  const str = String(valor).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return '';
  return str;
}

module.exports = {
  validarFiltros(query = {}) {
    const desde = validarFecha(query.desde);
    const hasta = validarFecha(query.hasta);
    return { desde, hasta };
  },

  serializarKpi(data) {
    return {
      ventas_dia: {
        count: Number(data.ventas_dia?.count || 0),
        total: redondear2(data.ventas_dia?.total)
      },
      ventas_mes: {
        count: Number(data.ventas_mes?.count || 0),
        total: redondear2(data.ventas_mes?.total)
      },
      compras_mes: {
        count: Number(data.compras_mes?.count || 0),
        total: redondear2(data.compras_mes?.total)
      },
      utilidad_estimada: redondear2(data.utilidad_estimada),
      productos_inventario: {
        total: Number(data.productos_inventario?.total || 0),
        stock_total: Number(data.productos_inventario?.stock_total || 0)
      },
      stock_bajo: Number(data.stock_bajo || 0),
      usuarios_activos: Number(data.usuarios_activos || 0),
      cuentas_por_pagar: {
        count: Number(data.cuentas_por_pagar?.count || 0),
        total: redondear2(data.cuentas_por_pagar?.total)
      }
    };
  }
};