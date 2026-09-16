import logoImg from '../assets/logo.png';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const CLAVE_SESION = 'session';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

const SUBITEM_USUARIOS = [
  { to: '/', etiqueta: 'Listado de Usuarios' },
  { to: '/reporte', etiqueta: 'Reporte de Usuarios' },
  { to: '/roles', etiqueta: 'Gestión de Roles' },
  { to: '/departamentos', etiqueta: 'Gestión de Departamentos' }
];

export default function Layout() {
  const [sesion] = useState(leerSesion);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuariosExpandido, setUsuariosExpandido] = useState(true);
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
            <button
              type="button"
              className="drawer-item"
              aria-expanded={usuariosExpandido}
              onClick={() => setUsuariosExpandido((valor) => !valor)}
            >
              <span>👥 Usuarios</span>
              <span className={`drawer-flecha${usuariosExpandido ? ' abierto' : ''}`}>▾</span>
            </button>
            {usuariosExpandido && (
              <div className="drawer-subitems">
                {SUBITEM_USUARIOS.map((sub) => (
                  <button
                    key={sub.to}
                    type="button"
                    className={`drawer-subitem${location.pathname === sub.to ? ' subitem-activo' : ''}`}
                    onClick={() => navegar(sub.to)}
                  >
                    {sub.etiqueta}
                  </button>
                ))}
              </div>
            )}
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