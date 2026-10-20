import logoImg from '../assets/logo.png';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { permisosCompras } from '../utils/permisosCompras';
import {
  MODULOS_SISTEMA,
  RUTA_LOGIN,
  RUTA_MODULOS_PRINCIPALES,
  esSubitemActivo,
  obtenerModuloActivo,
  obtenerTituloDocumento
} from '../config/navegacionSistema';

const CLAVE_SESION = 'session';
const CLAVE_EXPANDIDOS = 'sgifep.modulosExpandidos';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

function leerExpandidos() {
  try {
    const guardados = JSON.parse(sessionStorage.getItem(CLAVE_EXPANDIDOS) || '[]');
    return new Set(Array.isArray(guardados) ? guardados : []);
  } catch {
    return new Set();
  }
}

function esEscritorio() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 701px)').matches;
}

export default function Layout() {
  const [sesion] = useState(leerSesion);
  const [menuAbierto, setMenuAbierto] = useState(esEscritorio);
  const [modulosExpandidos, setModulosExpandidos] = useState(leerExpandidos);
  const location = useLocation();
  const moduloActivo = obtenerModuloActivo(location.pathname);
  const refModuloActivo = useRef(null);

  const permisos = permisosCompras(sesion);
  const modulosVisibles = MODULOS_SISTEMA.filter(
    (modulo) => !modulo.permiso || permisos[modulo.permiso]
  );

  function subitemsVisibles(modulo) {
    return modulo.subitems.filter(
      (subitem) => !subitem.permiso || permisos[subitem.permiso]
    );
  }

  function cerrarMenuSiMovil() {
    if (!esEscritorio()) setMenuAbierto(false);
  }

  useEffect(() => {
    sessionStorage.setItem(CLAVE_EXPANDIDOS, JSON.stringify([...modulosExpandidos]));
  }, [modulosExpandidos]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 701px)');
    const manejarCambio = (evento) => setMenuAbierto(evento.matches);
    media.addEventListener?.('change', manejarCambio);
    return () => media.removeEventListener?.('change', manejarCambio);
  }, []);

  useEffect(() => {
    if (!moduloActivo) return;

    setModulosExpandidos((previos) => {
      if (previos.has(moduloActivo)) return previos;
      const siguientes = new Set(previos);
      siguientes.add(moduloActivo);
      return siguientes;
    });

    refModuloActivo.current?.scrollIntoView({ block: 'nearest' });
  }, [moduloActivo]);

  useEffect(() => {
    document.title = `SGIFEP - ${obtenerTituloDocumento(location.pathname)}`;
  }, [location.pathname]);

  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape' && !esEscritorio()) setMenuAbierto(false);
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, []);

  if (!sesion || !sesion.token) {
    window.location.href = RUTA_LOGIN;
    return null;
  }

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = RUTA_LOGIN;
  }

  function alternarModulo(id) {
    if (id === moduloActivo) return;

    setModulosExpandidos((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  }

  return (
    <div className="layout">
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
          aria-controls="menuLateral"
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

      <div className="app-body">
        <aside
          id="menuLateral"
          className={`drawer${menuAbierto ? ' drawer-abierto' : ''}`}
        >
          <div className="drawer-cabecera">
            <span className="drawer-logo">SGIFEP</span>
          </div>
          <nav className="drawer-nav" aria-label="Menú de módulos">
            <a
              href={RUTA_MODULOS_PRINCIPALES}
              className="drawer-item drawer-volver-modulos"
              title="Volver al panel de módulos"
            >
              ← Módulos Principales
            </a>
            {modulosVisibles.map((modulo) => {
              const expandido =
                modulo.id === moduloActivo || modulosExpandidos.has(modulo.id);

              return (
                <Fragment key={modulo.id}>
                  <button
                    type="button"
                    ref={modulo.id === moduloActivo ? refModuloActivo : null}
                    className={`drawer-item${modulo.id === moduloActivo ? ' modulo-activo' : ''}`}
                    aria-expanded={expandido}
                    aria-controls={`subitems-${modulo.id}`}
                    onClick={() => alternarModulo(modulo.id)}
                  >
                    <span>{modulo.icono} {modulo.titulo}</span>
                    <span className={`drawer-flecha${expandido ? ' abierto' : ''}`}>▸</span>
                  </button>
                  {expandido && (
                    <div id={`subitems-${modulo.id}`} className="drawer-subitems">
                      {subitemsVisibles(modulo).map((subitem) => (
                        <Link
                          key={subitem.to}
                          to={subitem.to}
                          className={`drawer-subitem${
                            esSubitemActivo(location.pathname, subitem)
                              ? ' subitem-activo'
                              : ''
                          }`}
                          onClick={cerrarMenuSiMovil}
                        >
                          {subitem.etiqueta}
                        </Link>
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

        <div className="contenido">
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
