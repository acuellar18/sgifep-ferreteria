import { leerSesion } from '../services/api';

const ADMINISTRADOR = 'administrador';
const COMPRAS = 'compras';
const BODEGA = 'bodega';
const CAJA = 'caja';
const VENTAS = 'ventas';
const REPARTO = 'reparto';

const ROLES_INVENTARIO = [ADMINISTRADOR, COMPRAS, BODEGA, CAJA, VENTAS, REPARTO];
const ROLES_GESTION_INVENTARIO = [ADMINISTRADOR, COMPRAS, BODEGA];

function tieneAlgunRol(sesion, roles) {
  if (sesion?.superadmin) return true;
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  return roles.some((rol) => rolesSesion.includes(rol));
}

export function permisosInventario(sesion = leerSesion()) {
  return {
    consultarInventario: tieneAlgunRol(sesion, ROLES_INVENTARIO),
    consultarProductos: tieneAlgunRol(sesion, ROLES_INVENTARIO),
    gestionarProductos: tieneAlgunRol(sesion, ROLES_GESTION_INVENTARIO),
    eliminarProductos: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    verCostosProductos: tieneAlgunRol(sesion, ROLES_GESTION_INVENTARIO),
    consultarCategorias: tieneAlgunRol(sesion, ROLES_GESTION_INVENTARIO),
    gestionarCategorias: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarMovimientos: tieneAlgunRol(sesion, ROLES_GESTION_INVENTARIO),
    ajustarInventario: tieneAlgunRol(sesion, [ADMINISTRADOR, BODEGA]),
    consultarReporteInventario: tieneAlgunRol(sesion, ROLES_GESTION_INVENTARIO)
  };
}
