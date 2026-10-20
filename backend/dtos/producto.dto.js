const { HttpError } = require('../utils/http-error');

const TIPOS = ['producto', 'servicio'];
const UNIDADES = ['UNI', 'MTS', 'KG', 'LT', 'GL', 'CJA', 'PAQ', 'ROL'];

function numeroNoNegativo(valor, mensaje) {
  if (valor === undefined || valor === null || valor === '') return 0;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) throw new HttpError(400, mensaje);
  return numero;
}

function baseValidacion(datos = {}, { esCreacion = false } = {}) {
  const codigo = typeof datos.codigo === 'string' ? datos.codigo.trim().toUpperCase() : '';
  if (!codigo) throw new HttpError(400, 'El código es requerido');
  if (codigo.length > 30) throw new HttpError(400, 'El código no puede superar los 30 caracteres');

  const codigoBarras = typeof datos.codigo_barras === 'string' ? datos.codigo_barras.trim() : '';
  if (codigoBarras.length > 80) {
    throw new HttpError(400, 'El código de barras no puede superar los 80 caracteres');
  }

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'El nombre es requerido');
  if (nombre.length > 150) throw new HttpError(400, 'El nombre no puede superar los 150 caracteres');

  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
  if (descripcion.length > 500) {
    throw new HttpError(400, 'La descripción no puede superar los 500 caracteres');
  }

  let categoria_id = null;
  if (datos.categoria_id !== undefined && datos.categoria_id !== null && datos.categoria_id !== '') {
    categoria_id = Number(datos.categoria_id);
    if (!Number.isInteger(categoria_id) || categoria_id <= 0) {
      throw new HttpError(400, 'La categoría no es válida');
    }
  }

  const tipo = typeof datos.tipo === 'string' ? datos.tipo.trim().toLowerCase() : 'producto';
  if (!TIPOS.includes(tipo)) throw new HttpError(400, `Tipo no válido. Permitidos: ${TIPOS.join(', ')}`);

  const unidad_medida = typeof datos.unidad_medida === 'string'
    ? datos.unidad_medida.trim().toUpperCase()
    : 'UNI';
  if (!UNIDADES.includes(unidad_medida)) {
    throw new HttpError(400, `Unidad de medida no válida. Permitidas: ${UNIDADES.join(', ')}`);
  }

  const stock_minimo = numeroNoNegativo(datos.stock_minimo, 'El stock mínimo debe ser un número no negativo');
  const precio_venta = numeroNoNegativo(datos.precio_venta, 'El precio de venta debe ser un número no negativo');

  const resultado = {
    codigo,
    codigo_barras: codigoBarras || null,
    nombre,
    descripcion: descripcion || null,
    categoria_id,
    tipo,
    unidad_medida,
    stock_minimo,
    precio_venta,
    activo: datos.activo === undefined ? true : Boolean(datos.activo)
  };

  if (esCreacion) {
    const stock_inicial = numeroNoNegativo(
      datos.stock_inicial,
      'El inventario inicial debe ser un número no negativo'
    );
    const costo_inicial = numeroNoNegativo(
      datos.costo_inicial ?? datos.costo_ultimo,
      'El costo inicial debe ser un número no negativo'
    );

    if (tipo === 'servicio' && stock_inicial > 0) {
      throw new HttpError(400, 'Un servicio no puede tener inventario inicial');
    }

    resultado.stock_inicial = stock_inicial;
    resultado.costo_inicial = costo_inicial;
  }

  return resultado;
}

function validarCrear(datos = {}) {
  return baseValidacion(datos, { esCreacion: true });
}

function validarActualizar(datos = {}) {
  return baseValidacion(datos);
}

function serializar(fila, { incluirCostos = true } = {}) {
  if (!fila) return null;
  const tipo = fila.tipo || 'producto';
  const producto = {
    id: fila.id,
    codigo: fila.codigo,
    codigo_barras: fila.codigo_barras || null,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    categoria_id: fila.categoria_id,
    categoria_nombre: fila.categoria_nombre,
    tipo,
    unidad_medida: fila.unidad_medida,
    stock_actual: Number(fila.stock_actual || 0),
    stock_minimo: Number(fila.stock_minimo || 0),
    precio_venta: Number(fila.precio_venta || 0),
    imagen: Boolean(fila.imagen),
    imagen_miniatura: Boolean(fila.imagen_miniatura),
    imagen_mime: fila.imagen_mime || null,
    activo: Boolean(fila.activo),
    creado_en: fila.creado_en,
    actualizado_en: fila.actualizado_en,
    stock_bajo: tipo === 'producto' && Number(fila.stock_actual || 0) <= Number(fila.stock_minimo || 0)
  };

  if (incluirCostos) {
    producto.costo_ultimo = Number(fila.costo_ultimo || 0);
    producto.costo_promedio = Number(fila.costo_promedio || 0);
  }

  return producto;
}

function serializarLista(filas, opciones = {}) {
  return filas.map((fila) => serializar(fila, opciones));
}

function serializarAutocompletar(filas, { incluirCostos = true } = {}) {
  return filas.map((f) => {
    const producto = {
      id: f.id,
      codigo: f.codigo,
      nombre: f.nombre,
      tipo: f.tipo || 'producto',
      unidad_medida: f.unidad_medida,
      stock_actual: Number(f.stock_actual || 0)
    };
    if (incluirCostos) producto.costo_ultimo = Number(f.costo_ultimo || 0);
    return producto;
  });
}

module.exports = {
  validarCrear,
  validarActualizar,
  serializar,
  serializarLista,
  serializarAutocompletar
};
