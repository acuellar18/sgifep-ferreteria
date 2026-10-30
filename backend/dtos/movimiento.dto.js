const { HttpError } = require('../utils/http-error');

const TIPOS = ['entrada', 'salida', 'ajuste'];

const MOTIVOS = {
  compra: 'Compra',
  devolucion: 'Devolución',
  'ajuste de inventario': 'Ajuste de inventario',
  venta: 'Venta',
  merma: 'Merma',
  dano: 'Daño',
  'uso interno': 'Uso interno',
  otro: 'Otro'
};

const MOTIVOS_POR_TIPO = {
  entrada: ['compra', 'devolucion', 'ajuste de inventario', 'otro'],
  salida: ['venta', 'merma', 'dano', 'uso interno', 'otro'],
  ajuste: ['ajuste de inventario', 'otro']
};

function normalizarTexto(valor) {
  return typeof valor === 'string'
    ? valor.trim().toLowerCase().replace(/\s+/g, ' ')
    : '';
}

function sinAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function claveMotivo(valor) {
  return sinAcentos(normalizarTexto(valor));
}

function validarCrear(datos = {}) {
  const productoId = Number(datos.producto_id);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    throw new HttpError(400, 'El producto es requerido');
  }

  const tipo = normalizarTexto(datos.tipo);
  if (!TIPOS.includes(tipo)) {
    throw new HttpError(400, `Tipo de movimiento no válido. Permitidos: ${TIPOS.join(', ')}`);
  }

  const cantidad = Number(datos.cantidad);
  if (!Number.isFinite(cantidad)) {
    throw new HttpError(400, 'La cantidad debe ser un número válido');
  }
  if (tipo !== 'ajuste' && cantidad <= 0) {
    throw new HttpError(400, 'La cantidad debe ser mayor a 0');
  }
  if (cantidad < 0) {
    throw new HttpError(400, 'La cantidad no puede ser negativa');
  }

  const motivoClave = claveMotivo(datos.motivo);
  const permitidos = MOTIVOS_POR_TIPO[tipo] || [];
  if (!motivoClave || !permitidos.includes(motivoClave)) {
    throw new HttpError(400, 'El motivo no es válido para el tipo de movimiento');
  }

  const referencia = typeof datos.referencia === 'string' ? datos.referencia.trim() : '';
  if (referencia.length > 120) {
    throw new HttpError(400, 'La referencia no puede superar los 120 caracteres');
  }

  const observaciones = typeof datos.observaciones === 'string'
    ? datos.observaciones.trim()
    : '';
  if (observaciones.length > 500) {
    throw new HttpError(400, 'Las observaciones no pueden superar los 500 caracteres');
  }

  return {
    producto_id: productoId,
    tipo,
    cantidad,
    motivo: MOTIVOS[motivoClave],
    referencia: referencia || null,
    observaciones: observaciones || null
  };
}

function serializar(fila) {
  if (!fila) return null;

  const anterior = Number(fila.stock_anterior ?? 0);
  const nuevo = Number(fila.stock_nuevo ?? fila.saldo_resultante ?? 0);
  const cantidad = Number(fila.cantidad || 0);

  let diferencia = cantidad;
  if (fila.tipo === 'salida') diferencia = -cantidad;
  else if (fila.tipo === 'ajuste') diferencia = nuevo - anterior;

  return {
    id: Number(fila.id),
    producto_id: Number(fila.producto_id),
    producto_codigo: fila.producto_codigo || null,
    producto_nombre: fila.producto_nombre || null,
    unidad_medida: fila.unidad_medida || null,
    tipo: fila.tipo,
    cantidad,
    diferencia,
    stock_anterior: anterior,
    stock_nuevo: nuevo,
    motivo: fila.motivo || 'Otro',
    referencia: fila.referencia || null,
    observaciones: fila.observaciones || fila.notas || null,
    usuario_id: fila.usuario_id ? Number(fila.usuario_id) : null,
    usuario_nombre: fila.usuario_nombre || null,
    usuario_username: fila.usuario_username || null,
    creado_en: fila.creado_en
  };
}

function serializarLista(filas) {
  return filas.map(serializar);
}

module.exports = {
  TIPOS,
  MOTIVOS,
  MOTIVOS_POR_TIPO,
  validarCrear,
  serializar,
  serializarLista
};
