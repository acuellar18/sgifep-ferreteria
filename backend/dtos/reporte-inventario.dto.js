function numero(valor, decimales = 2) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? Number(n.toFixed(decimales)) : 0;
}

function serializarProducto(fila) {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    unidad_medida: fila.unidad_medida,
    categoria_nombre: fila.categoria_nombre || 'Sin categoría',
    stock_actual: numero(fila.stock_actual, 3),
    stock_minimo: fila.stock_minimo !== undefined ? numero(fila.stock_minimo, 3) : undefined,
    costo_promedio: numero(fila.costo_promedio, 4),
    faltante: fila.faltante !== undefined ? numero(fila.faltante, 3) : undefined,
    valor: numero(fila.valor),
    ultimo_movimiento: fila.ultimo_movimiento || null,
    dias_sin_movimiento: fila.dias_sin_movimiento !== undefined
      ? Number(fila.dias_sin_movimiento)
      : undefined
  };
}

function serializarCategoria(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    productos: Number(fila.productos || 0),
    unidades: numero(fila.unidades, 3),
    valor: numero(fila.valor)
  };
}

function serializar(datos = {}) {
  return {
    totales: {
      productos: Number(datos.totales?.productos || 0),
      unidades: numero(datos.totales?.unidades, 3),
      valor: numero(datos.totales?.valor),
      stock_bajo: Number(datos.totales?.stock_bajo || 0),
      sin_movimiento: Number(datos.totales?.sin_movimiento || 0)
    },
    categorias: (datos.categorias || []).map(serializarCategoria),
    stock_bajo: (datos.stock_bajo || []).map(serializarProducto),
    sin_movimiento: (datos.sin_movimiento || []).map(serializarProducto),
    categoria: datos.categoria
      ? { id: datos.categoria.id, nombre: datos.categoria.nombre }
      : null,
    dias_sin_movimiento: Number(datos.dias_sin_movimiento || 0),
    generado_en: datos.generado_en
  };
}

module.exports = { serializar };
