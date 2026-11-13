import { leerSesion } from '../services/api';

// Permisos del módulo Despacho. El rol reparto solo ve/gestiona los despachos
// asignados a él; administrador y bodega (encargado de despacho) gestionan todos.
const ADMINISTRADOR = 'administrador';
const BODEGA = 'bodega';
const REPARTO = 'reparto';

function tieneRol(sesion, rol) {
  if (sesion?.superadmin) return true;
  return (Array.isArray(sesion?.roles) ? sesion.roles : []).includes(rol);
}

export function permisosDespacho(sesion = leerSesion()) {
  const esGestor = tieneRol(sesion, ADMINISTRADOR) || tieneRol(sesion, BODEGA);
  const esReparto = (Array.isArray(sesion?.roles) ? sesion.roles : []).includes(REPARTO)
    && !esGestor && !sesion?.superadmin;

  return {
    esGestor, // administrador o bodega: gestiona todos los despachos
    esReparto, // reparto: solo ve/gestiona los suyos
    puedeCrearManual: esGestor,
    puedeAsignar: esGestor,
    puedeCancelar: esGestor,
    puedeReprogramar: esGestor,
    puedeCambiarEstado: esGestor || esReparto,
    puedeEntregar: esGestor || esReparto
  };
}
