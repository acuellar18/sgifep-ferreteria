const { HttpError } = require('../utils/http-error');

function baseValidacion(datos = {}) {
  const codigo = typeof datos.codigo === 'string' ? datos.codigo.trim().toUpperCase() : '';
  if (!codigo) throw new HttpError(400, 'El código es requerido');

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'El nombre es requerido');

  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';

  let categoria_id = null;
  if (datos.categoria_id !== undefined && datos.categoria_id !== null && datos.categoria_id !== '') {
    categoria_id = Number(datos.categoria_id);
    if (!Number.isInteger(categoria_id)) throw new HttpError(400, 'La categoría no es válida');
  }

  const unidad_medida = typeof datos.unidad_medida === 'string' ? datos.unidad_medida.trim().toUpperCase() : 'UNI';
  const unidadesValidas = ['UNI', 'MTS', 'KG', 'LT', 'GL', 'CJA', 'PAQ', 'ROL'];
  if (!unidadesValidas.includes(unidad_medida)) {
    throw new HttpError(400, `Unidad de medida no válida. Permitidas: ${unidadesValidas.join(', ')}`);
  }

  let stock_minimo = 0;
  if (datos.stock_minimo !== undefined && datos.stock_minimo !== null && datos.stock_minimo !== '') {
    stock_minimo = Number(datos.stock_minimo);
    if (!Number.isFinite(stock_minimo) || stock_minimo < 0) {
      throw new HttpError(400, 'El stock mínimo debe ser un número no negativo');
    }
  }

  let costo_ultimo = 0;
  if (datos.costo_ultimo !== undefined && datos.costo_ultimo !== null && datos.costo_ultimo !== '') {
    costo_ultimo = Number(datos.costo_ultimo);
    if (!Number.isFinite(costo_ultimo) || costo_ultimo < 0) {
      throw new HttpError(400, 'El costo debe ser un número no negativo');
    }
  }

  let precio_venta = 0;
  if (datos.precio_venta !== undefined && datos.precio_venta !== null && datos.precio_venta !== '') {
    precio_venta = Number(datos.precio_venta);
    if (!Number.isFinite(precio_venta) || precio_venta < 0) {
      throw new HttpError(400, 'El precio de venta debe ser un número no negativo');
    }
  }

  return {
    codigo,
    nombre,
    descripcion: descripcion || null,
    categoria_id,
    unidad_medida,
    stock_minimo,
    costo_ultimo,
    precio_venta,
    activo: datos.activo === undefined ? true : Boolean(datos.activo)
  };
}

function validarCrear(datos = {}) {
  return baseValidacion(datos);
}

function validarActualizar(datos = {}) {
  return baseValidacion(datos);
}

function serializar(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    categoria_id: fila.categoria_id,
    categoria_nombre: fila.categoria_nombre,
    unidad_medida: fila.unidad_medida,
    stock_actual: Number(fila.stock_actual || 0),
    stock_minimo: Number(fila.stock_minimo || 0),
    costo_ultimo: Number(fila.costo_ultimo || 0),
    costo_promedio: Number(fila.costo_promedio || 0),
    precio_venta: Number(fila.precio_venta || 0),
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    stock_bajo: Number(fila.stock_actual || 0) <= Number(fila.stock_minimo || 0)
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

function serializarAutocompletar(filas) {
  return filas.map(f => ({
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    costo_ultimo: Number(f.costo_ultimo || 0),
    unidad_medida: f.unidad_medida,
    stock_actual: Number(f.stock_actual || 0)
  }));
}

module.exports = {
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista,
  serializarAutocompletar
};