import { leerSesion } from '../services/api';

const ADMINISTRADOR = 'administrador';
const VENTAS = 'ventas';
const CAJA = 'caja';

const ROLES_FACTURACION = [ADMINISTRADOR, VENTAS, CAJA];
const ROLES_GESTION_CLIENTES = [ADMINISTRADOR, VENTAS, CAJA];
const ROLES_FACTURAR = [ADMINISTRADOR, VENTAS];
const ROLES_COBRAR = [ADMINISTRADOR, CAJA, VENTAS];

function tieneAlgunRol(sesion, roles) {
  if (sesion?.superadmin) return true;
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  return roles.some((rol) => rolesSesion.includes(rol));
}

export function permisosFacturacion(sesion = leerSesion()) {
  return {
    consultarFacturacion: tieneAlgunRol(sesion, ROLES_FACTURACION),
    consultarClientes: tieneAlgunRol(sesion, ROLES_FACTURACION),
    gestionarClientes: tieneAlgunRol(sesion, ROLES_GESTION_CLIENTES),
    consultarFacturas: tieneAlgunRol(sesion, ROLES_FACTURACION),
    crearFacturas: tieneAlgunRol(sesion, ROLES_FACTURAR),
    anularFacturas: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarCobros: tieneAlgunRol(sesion, ROLES_FACTURACION),
    registrarCobros: tieneAlgunRol(sesion, ROLES_COBRAR),
    anularCobros: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    registrarDevoluciones: tieneAlgunRol(sesion, ROLES_COBRAR),
    consultarReporteFacturacion: tieneAlgunRol(sesion, ROLES_FACTURACION),
    consultarAuditoria: tieneAlgunRol(sesion, [ADMINISTRADOR]),
    consultarReporteGeneral: tieneAlgunRol(sesion, [ADMINISTRADOR])
  };
}
