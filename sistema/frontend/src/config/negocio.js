export const NEGOCIO = {
  nombre: 'Ferretería El Puente',
  nit: '1234567-8',
  direccion: 'San Lucas Toliman, Solola',
  telefono: '5606-9373'
};

export function datosNegocio(empresa = {}) {
  return { ...(empresa || {}), ...NEGOCIO };
}
