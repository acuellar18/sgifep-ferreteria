import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const CLAVE_SESION = 'session';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

// Layout con header + sidebar. Reutiliza la sesión que crea login.html
// (localStorage['session']) y sin sesión redirige al login estático.
export default function Layout() {
  const [sesion] = useState(leerSesion);
  const navigate = useNavigate();
  const location = useLocation();

  if (!sesion) {
    window.location.href = '/login.html';
    return null;
  }

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    navigate('/');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 50);
  }

  const itemsNav = [
    { to: '/', etiqueta: 'Usuarios' },
    { to: '/reporte', etiqueta: 'Reporte' },
    { to: '/roles', etiqueta: 'Roles' },
    { to: '/departamentos', etiqueta: 'Departamentos' }
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">SGIFEP</div>
        <nav className="sidebar-nav">
          {itemsNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={location.pathname === item.to ? 'link-nav link-activo' : 'link-nav'}
            >
              {item.etiqueta}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/index.html" className="link-nav link-volver">← Volver al sitio</a>
        </div>
      </aside>

      <div className="contenido">
        <header className="topbar">
          <h1 className="topbar-titulo">Módulo de Usuarios</h1>
          <div className="topbar-usuario">
            <span className="chip">{sesion.nombre || sesion.username}</span>
            <span className="chip chip-rol">{sesion.rol || 'usuario'}</span>
            <button type="button" className="btn btn-secundario" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}