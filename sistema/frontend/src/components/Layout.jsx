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

// Menú desplegable: las opciones "Módulos Principales" y "Usuarios" se
// comportan como acordeones (expanden/colapsan) con sus subopciones.
const SUBITEM_USUARIOS = [
  { to: '/', etiqueta: 'Listado de Usuarios' },
  { to: '/reporte', etiqueta: 'Reporte de Usuarios' },
  { to: '/roles', etiqueta: 'Gestión de Roles' },
  { to: '/departamentos', etiqueta: 'Gestión de Departamentos' }
];

// Módulos del sistema. Solo "Usuarios" está compilado dentro de esta SPA;
// el resto son placeholders (sin enlaces) para no provocar errores 404.
const MODULOS_SISTEMA = [
  { nombre: 'Compras y Abastecimiento', icono: '🛒' },
  { nombre: 'Control de Inventario', icono: '📦' },
  { nombre: 'Facturación y Cobro', icono: '🧾' },
  { nombre: 'Despacho de Productos', icono: '🚚' },
  { nombre: 'Reportes', icono: '📊' }
];

// Layout único: encabezado superior negro/naranja (igual que el panel de
// acceso modulos.html) + menú lateral desplegable (drawer). El contenido de
// cada opción se carga en la misma pantalla mediante el Outlet (SPA), sin
// abandonar la interfaz. NO hay barra lateral oscura fija.
export default function Layout() {
  const [sesion] = useState(leerSesion);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuariosExpandido, setUsuariosExpandido] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Reutiliza la sesión que crea login.html: exige sesión Y token JWT.
  // (el token lo reenvía api.js para proteger todas las peticiones).
  if (!sesion || !sesion.token) {
    window.location.href = '/login.html';
    return null;
  }

  // Cierre del menú con la tecla Escape.
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
      {/* Encabezado superior unificado (línea gráfica del panel de control). */}
      <header className="app-header">
        <div className="header-logo-box">
          <img src={logoImg} alt="Ferretería El Puente" className="header-logo" />
        </div>
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label="Abrir o cerrar menú"
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
        <div className="header-titulos">
          <span className="header-titulo-naranja">MÓDULOS</span>
          <span className="header-subtitulo-blanco">PANEL DE ACCESO</span>
        </div>
        <a href="/usuarios/modulos.html" className="volver-panel">← Panel de Módulos</a>
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

      {/* Cuerpo: menú lateral (drawer) + contenido en maquetación Flexbox.
          Al abrir/cerrar el menú, el contenido se desplaza y reajusta su
          ancho automáticamente; nunca queda tapado por ventanas flotantes. */}
      <div className="app-body">
        <aside className={`drawer${menuAbierto ? ' drawer-abierto' : ''}`}>
          <div className="drawer-cabecera">
            <span className="drawer-logo">SGIFEP</span>
            <button
              type="button"
              className="drawer-cerrar"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
            >
              ×
            </button>
          </div>
          <nav className="drawer-nav">
            {/* Enlace simple al panel de módulos (modulos.html ya desplegado en
                backend/public). SIN acordeón ni submenús: evita depender de
                variables de estado que provoquen errores de renderizado. */}
            <a href="/modulos.html" className="drawer-item drawer-volver-modulos" title="Volver al panel de módulos">
              ← Módulos Principales
            </a>
            <button
              type="button"
              className="drawer-item"
              aria-expanded={usuariosExpandido}
              onClick={() => setUsuariosExpandido((valor) => !valor)}
            >
              <span>👥 Usuarios</span>
              <span className={`drawer-flecha${usuariosExpandido ? ' abierto' : ''}`}>▸</span>
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

        {/* Contenido del módulo (se carga en la misma pantalla, bajo el encabezado). */}
        <div className="contenido">
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}