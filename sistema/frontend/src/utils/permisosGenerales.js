import { leerSesion } from '../services/api';

// Permisos generales (no ligados a un módulo con capa propia):
// - administrarUsuarios: módulo Usuarios/Roles/Departamentos (solo administrador,
//   igual que el backend `requerirRoles([ROL_ADMINISTRADOR])`).
// - consultarDespacho: mismas roles que exige el backend en despachos/rutas.
const ADMINISTRADOR = 'administrador';

function tieneAlgunRol(sesion, roles) {
  if (sesion?.superadmin) return true;
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  return roles.some((rol) => rolesSesion.includes(rol));
}

export function permisosGenerales(sesion = leerSesion()) {
  return {
    administrarUsuarios: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarDespacho: tieneAlgunRol(sesion, [
      ADMINISTRADOR,
      'compras',
      'bodega',
      'caja',
      'ventas',
      'reparto'
    ])
  };
}
