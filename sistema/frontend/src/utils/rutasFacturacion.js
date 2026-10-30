export function rutaImpresionFacturaVenta(id) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/facturacion/facturas/${id}/imprimir`;
}
