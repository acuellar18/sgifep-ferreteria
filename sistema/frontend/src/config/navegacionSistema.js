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
    id: 'caja',
    titulo: 'Caja',
    to: '/caja',
    permiso: 'consultarCaja'
  },
  {
    id: 'pos',
    titulo: 'POS / Venta',
    to: '/pos',
    permiso: 'consultarCobros'
  },
  {
    id: 'usuarios',
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
    titulo: 'Compras',
    permiso: 'consultarCompras',
    subitems: [
      { to: '/compras/proveedores', etiqueta: 'Proveedores' },
      { to: '/compras/facturas/nueva', etiqueta: 'Registrar compra', permiso: 'crearCompra' },
      { to: '/compras/facturas', etiqueta: 'Facturas y pagos' }
    ]
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    permiso: 'consultarInventario',
    subitems: [
      { to: '/inventario/productos', etiqueta: 'Productos' },
      { to: '/inventario/categorias', etiqueta: 'Categorías', permiso: 'consultarCategorias' },
      { to: '/inventario/movimientos', etiqueta: 'Movimientos de Inventario', permiso: 'consultarMovimientos' }
    ]
  },
  {
    id: 'facturacion',
    titulo: 'Facturación',
    permiso: 'consultarFacturacion',
      subitems: [
        { to: '/facturacion/facturas', etiqueta: 'Listado de Facturas', permiso: 'consultarFacturas' },
        { to: '/facturacion/clientes', etiqueta: 'Clientes', permiso: 'consultarClientes' }
      ]
  },
    {
    id: 'despacho',
    titulo: 'Despacho',
    subitems: [
      { to: '/despacho', etiqueta: 'Listado de Despachos' },
      { to: '/despacho/rutas-entregas', etiqueta: 'Rutas y Entregas' }
    ]
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    subitems: [
      { to: '/reportes', etiqueta: 'Reporte General' },
      { to: '/reportes/ventas', etiqueta: 'Reporte de Ventas' },
      { to: '/reportes/compras', etiqueta: 'Reporte de Compras', permiso: 'consultarReportes' },
      { to: '/reportes/inventario', etiqueta: 'Reporte de Inventario', permiso: 'consultarReporteInventario' },
      { to: '/seguridad/auditoria', etiqueta: 'Auditoría', permiso: 'consultarAuditoria' }
    ]
  },
  {
    id: 'perfil',
    titulo: 'Mi perfil',
    to: '/perfil'
  }
];

export function esSubitemActivo(pathname, subitem) {
  if (!subitem.to) return false;
  if (subitem.to === '/') return pathname === '/';
  if (subitem.to === '/compras/facturas') {
    return pathname === subitem.to || (
      pathname.startsWith(`${subitem.to}/`) && pathname !== '/compras/facturas/nueva'
    );
  }
  if (subitem.to === '/compras/proveedores') {
    return pathname === subitem.to || pathname.startsWith(`${subitem.to}/`);
  }
  return pathname === subitem.to;
}

export function esModuloActivo(pathname, modulo) {
  if (modulo.to) return esSubitemActivo(pathname, { to: modulo.to });
  return (modulo.subitems || []).some((subitem) => esSubitemActivo(pathname, subitem));
}

export function obtenerModuloActivo(pathname) {
  const modulo = MODULOS_SISTEMA.find((item) => esModuloActivo(pathname, item));
  return modulo?.id || null;
}

export function obtenerTituloDocumento(pathname) {
  if (pathname === '/compras') return 'Compras - Facturas y pagos';

  const modulo = MODULOS_SISTEMA.find((item) => esModuloActivo(pathname, item));
  if (!modulo) return 'Sistema';
  if (modulo.to) return modulo.titulo;

  const subitem = modulo.subitems.find((item) => esSubitemActivo(pathname, item));
  return subitem ? `${modulo.titulo} - ${subitem.etiqueta}` : 'Sistema';
}
