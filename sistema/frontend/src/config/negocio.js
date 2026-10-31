export const NEGOCIO = {
  nombre: 'Ferretería El Puente',
  nit: '1234567-8',
  direccion: 'Ciudad de Guatemala',
  telefono: '2222-3333'
};

export function datosNegocio(empresa = {}) {
  return { ...(empresa || {}), ...NEGOCIO };
}
