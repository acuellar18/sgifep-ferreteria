import { leerSesion } from '../services/api';

const ADMINISTRADOR = 'administrador';
const COMPRAS = 'compras';
const BODEGA = 'bodega';
const CAJA = 'caja';

function tieneAlgunRol(sesion, roles) {
  if (sesion?.superadmin) return true;
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  return roles.some((rol) => rolesSesion.includes(rol));
}

export function permisosCompras(sesion = leerSesion()) {
  return {
    consultarCompras: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, BODEGA, CAJA]),
    crearCompra: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS]),
    registrarPago: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, CAJA]),
    anularCompra: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    anularPago: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarProveedores: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, BODEGA, CAJA]),
    editarProveedor: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS]),
    eliminarProveedor: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarOrdenes: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, BODEGA]),
    crearOrden: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS]),
    recibirOrden: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, BODEGA]),
    consultarReportes: tieneAlgunRol(sesion, [ADMINISTRADOR, COMPRAS, BODEGA, CAJA]),
    configurarEmpresa: tieneAlgunRol(sesion, [ADMINISTRADOR])
  };
}
