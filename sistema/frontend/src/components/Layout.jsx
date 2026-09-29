import logoImg from '../assets/logo.png';
import { Fragment, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './modulos-menu.css';

const CLAVE_SESION = 'session';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

// Módulos que ya tienen páginas HTML propias. Cada uno despliega su lista de
// submódulos en el menú lateral, igual que Usuarios. El módulo activo queda
// expandido y resaltado en naranja; los demás, colapsados.
//
// Las rutas se arman con BASE_MODULOS porque estas páginas estáticas se
// sirven bajo /usuarios/ en desarrollo (base de Vite, puerto 5174) y bajo la
// raíz en producción (Express, puerto 3000).
const BASE_MODULOS = import.meta.env.DEV ? '/usuarios/' : '/';

const MODULOS_SISTEMA = [
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
    subitems: [
      { archivo: 'index.html', etiqueta: 'Listado de Compras' },
      { archivo: 'proveedores.html', etiqueta: 'Proveedores' },
      { archivo: 'ordenes-compra.html', etiqueta: 'Órdenes de Compra' },
      { archivo: 'reporte.html', etiqueta: 'Reporte de Compras' }
    ]
  },
  {
    id: 'inventario',
    icono: '📦',
    titulo: 'Inventario',
    subitems: [
      { archivo: 'index.html', etiqueta: 'Listado de Produtos' },
      { archivo: 'categorias.html', etiqueta: 'Categorías' },
      { archivo: 'movimientos.html', etiqueta: 'Movimientos de Inventario' },
      { archivo: 'reporte.html', etiqueta: 'Reporte de Inventario' }
    ]
  },
  {
    id: 'facturacion',
    icono: '🧾',
    titulo: 'Facturación',
    subitems: [
      { archivo: 'index.html', etiqueta: 'Listado de Facturas' },
      { archivo: 'clientes.html', etiqueta: 'Clientes' },
      { archivo: 'cobros.html', etiqueta: 'Cobros' },
      { archivo: 'reporte.html', etiqueta: 'Reporte de Facturación' }
    ]
  },
  {
    id: 'despacho',
    icono: '📤',
    titulo: 'Despacho',
    subitems: [
      { archivo: 'index.html', etiqueta: 'Listado de Despachos' },
      { archivo: 'rutas-entregas.html', etiqueta: 'Rutas y Entregas' },
      { archivo: 'reporte.html', etiqueta: 'Reporte de Despachos' }
    ]
  },
  {
    id: 'reportes',
    icono: '📊',
    titulo: 'Reportes',
    subitems: [
      { archivo: 'index.html', etiqueta: 'Reporte General' },
      { archivo: 'ventas.html', etiqueta: 'Reporte de Ventas' },
      { archivo: 'compras.html', etiqueta: 'Reporte de Compras' },
      { archivo: 'inventario.html', etiqueta: 'Reporte de Inventario' }
    ]
  }
];

export default function Layout() {
  const [sesion] = useState(leerSesion);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [moduloExpandido, setModuloExpandido] = useState('usuarios');
  const navigate = useNavigate();
  const location = useLocation();

  if (!sesion || !sesion.token) {
    window.location.href = '/login.html';
    return null;
  }

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, []);

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = '/login.html';
  }

  function navegar(ruta) {
    setMenuAbierto(false);
    navigate(ruta);
  }

  return (
    <div className="layout">
      {/* Encabezado superior unificado */}
      <header className="app-header">
        <div className="header-logo-box">
          <img src={logoImg} alt="Ferretería El Puente" className="header-logo" />
        </div>
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label="Alternar menú"
          aria-expanded={menuAbierto}
        >
          ☰
        </button>
        <div className="header-titulos">
          <span className="header-titulo-naranja">MÓDULOS</span>
          <span className="header-subtitulo-blanco">PANEL DE ACCESO</span>
        </div>
        <div className="header-usuario">
          <span className="avatar">👤</span>
          <div className="header-usuario-info">
            <span className="header-nombre">{sesion.nombre || sesion.username}</span>
            <span className="rol-badge">
              {sesion.roles?.length ? sesion.roles.join(', ') : (sesion.rol || 'usuario')}
            </span>
          </div>
          <button type="button" className="logout-link" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Menú lateral (drawer) + Contenido */}
      <div className="app-body">
        <aside className={`drawer${menuAbierto ? ' drawer-abierto' : ''}`}>
          <div className="drawer-cabecera">
            <span className="drawer-logo">SGIFEP</span>
          </div>
          <nav className="drawer-nav">
            <a href="/usuarios/modulos.html" className="drawer-item drawer-volver-modulos" title="Volver al panel de módulos">
              ← Módulos Principales
            </a>
            {MODULOS_SISTEMA.map((modulo) => {
              const expandido = moduloExpandido === modulo.id;
              return (
                <Fragment key={modulo.id}>
                  <button
                    type="button"
                    className={`drawer-item${modulo.id === 'usuarios' ? ' modulo-activo' : ''}`}
                    aria-expanded={expandido}
                    onClick={() => setModuloExpandido(modulo.id === moduloExpandido ? null : modulo.id)}
                  >
                    <span>{modulo.icono} {modulo.titulo}</span>
                    <span className={`drawer-flecha${expandido ? ' abierto' : ''}`}>▾</span>
                  </button>
                  {expandido && (
                    <div className="drawer-subitems">
                      {modulo.subitems.map((sub) => (
                        sub.to ? (
                          <button
                            key={sub.to}
                            type="button"
                            className={`drawer-subitem${location.pathname === sub.to ? ' subitem-activo' : ''}`}
                            onClick={() => navegar(sub.to)}
                          >
                            {sub.etiqueta}
                          </button>
                        ) : (
                          <a
                            key={sub.archivo}
                            className="drawer-subitem drawer-subitem-enlace"
                            href={`${BASE_MODULOS}${modulo.id}/${sub.archivo}`}
                          >
                            {sub.etiqueta}
                          </a>
                        )
                      ))}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </nav>
          <div className="drawer-footer">
            <a href="/index.html" className="drawer-volver">← Volver al sitio</a>
          </div>
        </aside>

        {/* Contenido del módulo */}
        <div className="contenido">
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}