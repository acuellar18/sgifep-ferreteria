import { leerSesion } from '../services/api';

const ADMINISTRADOR = 'administrador';
const CAJA = 'caja';
const VENTAS = 'ventas';

const ROLES_CAJA = [ADMINISTRADOR, CAJA, VENTAS];
const ROLES_OPERAR_CAJA = [ADMINISTRADOR, CAJA];

function tieneAlgunRol(sesion, roles) {
  if (sesion?.superadmin) return true;
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  return roles.some((rol) => rolesSesion.includes(rol));
}

export function permisosCaja(sesion = leerSesion()) {
  return {
    consultarCaja: tieneAlgunRol(sesion, ROLES_CAJA),
    abrirCaja: tieneAlgunRol(sesion, ROLES_OPERAR_CAJA),
    cerrarCaja: tieneAlgunRol(sesion, ROLES_OPERAR_CAJA)
  };
}
