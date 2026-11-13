export const NEGOCIO = {
  nombre: 'Ferretería El Puente',
  nit: '1234567-8',
  direccion: 'SAN LUCAS TOLIMAN, Sololá',
  telefono: '2222-3333'
};

export function datosNegocio(empresa = {}) {
  return { ...(empresa || {}), ...NEGOCIO };
}
