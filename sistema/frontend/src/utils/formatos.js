export function formatearMoneda(valor) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function formatearNumero(valor, decimales = 2) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const valor = String(fecha).slice(0, 10);
  const [anio, mes, dia] = valor.split('-');
  if (!anio || !mes || !dia) return '—';
  return `${dia}/${mes}/${anio}`;
}

export function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function etiquetaEstadoPago(estado) {
  return { pagada: 'Pagada', parcial: 'Parcial', pendiente: 'Pendiente' }[estado] || estado || '—';
}

export function etiquetaEstado(estado) {
  return { recibida: 'Recibida', emitida: 'Emitida', anulada: 'Anulada' }[estado] || estado || '—';
}

export function rutaApiBase() {
  return import.meta.env.BASE_URL || '/';
}
