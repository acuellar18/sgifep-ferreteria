import logoImg from '../assets/logo.png';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';
import IconoModulo from './IconoModulo';
import { permisosCaja } from '../utils/permisosCaja';
import { permisosCompras } from '../utils/permisosCompras';
import { permisosFacturacion } from '../utils/permisosFacturacion';
import { permisosInventario } from '../utils/permisosInventario';
import { permisosGenerales } from '../utils/permisosGenerales';
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
  const [sesion, setSesion] = useState(leerSesion);
  const [menuAbierto, setMenuAbierto] = useState(esEscritorio);
  const [modulosExpandidos, setModulosExpandidos] = useState(leerExpandidos);
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [revisionFoto, setRevisionFoto] = useState(0);
  const location = useLocation();
  const moduloActivo = obtenerModuloActivo(location.pathname);
  const refModuloActivo = useRef(null);

  const permisos = {
    ...permisosCaja(sesion),
    ...permisosCompras(sesion),
    ...permisosInventario(sesion),
    ...permisosFacturacion(sesion),
    ...permisosGenerales(sesion)
  };

  // Usuario SIN roles asignados: puede ver el catálogo completo de módulos,
  // pero cada uno está protegido (RequierePermiso) y mostrará el aviso
  // "No tiene permiso para este módulo" al abrirlo.
  const rolesSesion = Array.isArray(sesion?.roles) ? sesion.roles : [];
  const sinRoles = !sesion?.superadmin && rolesSesion.length === 0;
  const esAdmin = Boolean(sesion?.superadmin) || rolesSesion.includes('administrador');

  const modulosVisibles = MODULOS_SISTEMA.filter((modulo) => {
    if (modulo.soloAdmin && !esAdmin) return false;
    if (sinRoles) return true;
    return !modulo.permiso || permisos[modulo.permiso];
  });

  function subitemsVisibles(modulo) {
    return (modulo.subitems || []).filter((subitem) => {
      if (subitem.soloAdmin && !esAdmin) return false;
      if (sinRoles) return true;
      return !subitem.permiso || permisos[subitem.permiso];
    });
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

    setModulosExpandidos(new Set([moduloActivo]));

    refModuloActivo.current?.scrollIntoView({ block: 'nearest' });
  }, [moduloActivo]);

  useEffect(() => {
    document.title = `SGIFEP - ${obtenerTituloDocumento(location.pathname)}`;
  }, [location.pathname]);

  useEffect(() => {
    const refrescarSesion = () => setSesion(leerSesion());
    window.addEventListener('sgifep:sesion', refrescarSesion);
    return () => window.removeEventListener('sgifep:sesion', refrescarSesion);
  }, []);

  useEffect(() => {
    let activo = true;
    let objectUrl = '';
    setFotoPerfil('');

    if (!sesion?.token) return undefined;

    api.get('/perfil/foto', { params: { v: Date.now() }, responseType: 'blob' })
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setFotoPerfil(objectUrl);
      })
      .catch(() => {
        if (activo) setFotoPerfil('');
      });

    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sesion?.token, revisionFoto]);

  useEffect(() => {
    const refrescarFoto = () => setRevisionFoto((valor) => valor + 1);
    window.addEventListener('sgifep:perfil', refrescarFoto);
    return () => window.removeEventListener('sgifep:perfil', refrescarFoto);
  }, []);

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

    setModulosExpandidos((previos) => (
      previos.has(id) ? new Set() : new Set([id])
    ));
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
          <span className="avatar">
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt={`Foto de ${sesion.nombre || sesion.username}`}
                onError={() => setFotoPerfil('')}
              />
            ) : (
              <IconoModulo id="avatar" tamano={20} />
            )}
          </span>
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
              Módulos Principales
            </a>
            {modulosVisibles.map((modulo) => {
              if (modulo.to) {
                return (
                  <Link
                    key={modulo.id}
                    ref={modulo.id === moduloActivo ? refModuloActivo : null}
                    to={modulo.to}
                    className={`drawer-item${modulo.id === moduloActivo ? ' modulo-activo' : ''}`}
                    onClick={cerrarMenuSiMovil}
                  >
                    <span className="drawer-item-texto">
                      <IconoModulo id={modulo.id} className="drawer-item-icono" />
                      <span>{modulo.titulo}</span>
                    </span>
                  </Link>
                );
              }

              const expandido = modulosExpandidos.has(modulo.id);

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
                    <span className="drawer-item-texto">
                      <IconoModulo id={modulo.id} className="drawer-item-icono" />
                      <span>{modulo.titulo}</span>
                    </span>
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
