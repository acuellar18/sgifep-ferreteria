export const BASE_SISTEMA = import.meta.env.BASE_URL;
export const RUTA_MODULOS_PRINCIPALES = '/modulos.html';
export const RUTA_LOGIN = '/login.html';

// Catálogo único de navegación del Sistema. Las rutas `to` son internas del
// router React (basename /usuarios); los módulos aún no desarrollados usan
// las rutas placeholder registradas en App.jsx.
// Las páginas HTML estáticas de public/assets-modulos/sistema-modulos.js
// mantienen su propio catálogo de destinos React para no salirse del layout.
export const MODULOS_SISTEMA = [
  {
    id: 'usuarios',
    icono: '👥',
    titulo: 'Usuarios',
    subitems: [
      { to: '/', etiqueta: 'Listado de Usuarios' },
      { to: '/reporte', etiqueta: 'Reporte de Usuarios' },
      { to: '/roles', etiqueta: 'Gestión de Roles' },
      { to: '/departamentos', etiqueta: 'Gestión de Departamentos' }
    ]
  },
  {
    id: 'compras',
    icono: '🛒',
    titulo: 'Compras',
    permiso: 'consultarCompras',
    subitems: [
      { to: '/compras/facturas', etiqueta: 'Facturas de proveedor' },
      { to: '/compras/proveedores', etiqueta: 'Proveedores' }
    ]
  },
  {
    id: 'inventario',
    icono: '📦',
    titulo: 'Inventario',
    subitems: [
      { to: '/inventario', etiqueta: 'Listado de Productos' },
      { to: '/inventario/categorias', etiqueta: 'Categorías' },
      { to: '/inventario/movimientos', etiqueta: 'Movimientos de Inventario' },
      { to: '/inventario/reporte', etiqueta: 'Reporte de Inventario' }
    ]
  },
  {
    id: 'facturacion',
    icono: '🧾',
    titulo: 'Facturación',
    subitems: [
      { to: '/facturacion', etiqueta: 'Listado de Facturas' },
      { to: '/facturacion/clientes', etiqueta: 'Clientes' },
      { to: '/facturacion/cobros', etiqueta: 'Cobros' },
      { to: '/facturacion/reporte', etiqueta: 'Reporte de Facturación' }
    ]
  },
  {
    id: 'despacho',
    icono: '📤',
    titulo: 'Despacho',
    subitems: [
      { to: '/despacho', etiqueta: 'Listado de Despachos' },
      { to: '/despacho/rutas-entregas', etiqueta: 'Rutas y Entregas' },
      { to: '/despacho/reporte', etiqueta: 'Reporte de Despachos' }
    ]
  },
  {
    id: 'reportes',
    icono: '📊',
    titulo: 'Reportes',
    subitems: [
      { to: '/reportes', etiqueta: 'Reporte General' },
      { to: '/reportes/ventas', etiqueta: 'Reporte de Ventas' },
      { to: '/reportes/compras', etiqueta: 'Reporte de Compras', permiso: 'consultarReportes' },
      { to: '/reportes/inventario', etiqueta: 'Reporte de Inventario' }
    ]
  }
];

export function esSubitemActivo(pathname, subitem) {
  if (!subitem.to) return false;
  if (subitem.to === '/') return pathname === '/';
  if (subitem.to === '/compras/proveedores') {
    return pathname === subitem.to || pathname.startsWith(`${subitem.to}/`);
  }
  return pathname === subitem.to;
}

export function obtenerModuloActivo(pathname) {
  const modulo = MODULOS_SISTEMA.find((item) =>
    item.subitems.some((subitem) => esSubitemActivo(pathname, subitem))
  );
  return modulo?.id || null;
}

export function obtenerTituloDocumento(pathname) {
  if (pathname === '/compras') return 'Compras - Facturas de proveedor';

  const modulo = MODULOS_SISTEMA.find((item) =>
    item.subitems.some((subitem) => esSubitemActivo(pathname, subitem))
  );
  const subitem = modulo?.subitems.find((item) => esSubitemActivo(pathname, item));

  return modulo && subitem ? `${modulo.titulo} - ${subitem.etiqueta}` : 'Sistema';
}
