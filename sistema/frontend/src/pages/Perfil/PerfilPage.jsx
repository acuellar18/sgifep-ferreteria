import { useEffect, useRef, useState } from 'react';
import api, { leerSesion } from '../../services/api';
import { useNotificacion } from '../../components/Toast';

const FORM_VACIO = { nombre: '', apellido: '', correo: '' };

function iniciales(nombre, apellido) {
  return `${nombre || ''} ${apellido || ''}`
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || '')
    .join('') || 'US';
}

function IconoCamara() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function IconoSol() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconoLuna() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
    </svg>
  );
}

export default function PerfilPage() {
  const notificar = useNotificacion();
  const inputFoto = useRef(null);
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState('');
  const [fotoRevision, setFotoRevision] = useState(0);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/perfil');
      const data = res.data;
      setPerfil(data);
      setForm({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        correo: data.correo || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    let activo = true;
    let objectUrl = '';
    setFotoUrl('');

    if (!perfil?.tiene_foto) return undefined;

    api.get('/perfil/foto', { params: { v: Date.now() }, responseType: 'blob' })
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setFotoUrl(objectUrl);
      })
      .catch(() => {
        if (activo) setFotoUrl('');
      });

    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [perfil?.tiene_foto, perfil?.actualizado_en, fotoRevision]);

  function actualizarSesion(data) {
    const sesion = leerSesion();
    if (!sesion) return;
    localStorage.setItem(
      'session',
      JSON.stringify({ ...sesion, nombre: data.nombre, correo: data.correo || null })
    );
    window.dispatchEvent(new Event('sgifep:sesion'));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const res = await api.put('/perfil', {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim()
      });
      setPerfil(res.data);
      setForm({
        nombre: res.data.nombre || '',
        apellido: res.data.apellido || '',
        correo: res.data.correo || ''
      });
      actualizarSesion(res.data);
      notificar.exito('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      notificar.error('La foto debe ser JPG, PNG o WebP');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      notificar.error('La foto no puede superar los 5 MB');
      return;
    }

    setSubiendo(true);
    try {
      const datos = new FormData();
      datos.append('foto', archivo);
      const res = await api.post('/perfil/foto', datos);
      setPerfil(res.data);
      setFotoRevision((valor) => valor + 1);
      window.dispatchEvent(new Event('sgifep:perfil'));
      notificar.exito('Foto de perfil actualizada');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function quitarFoto() {
    setEliminandoFoto(true);
    try {
      const res = await api.delete('/perfil/foto');
      setPerfil(res.data);
      window.dispatchEvent(new Event('sgifep:perfil'));
      notificar.exito('Foto de perfil eliminada');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setEliminandoFoto(false);
    }
  }

  if (cargando) {
    return (
      <section className="perfil">
        <div className="perfil-cargando">Cargando perfil...</div>
      </section>
    );
  }

  if (!perfil) {
    return (
      <section className="perfil">
        <div className="perfil-cargando">
          <p>{error || 'No se pudo cargar el perfil.'}</p>
          <button type="button" className="btn btn-primario" onClick={cargar}>Reintentar</button>
        </div>
      </section>
    );
  }

  const nombreCompleto = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim();
  const roles = perfil.roles?.length ? perfil.roles.map((rol) => rol.nombre).join(', ') : 'usuario';
  const anioIngreso = perfil.creado_en ? new Date(perfil.creado_en).getFullYear() : '—';

  return (
    <section className="perfil">
      <header className="perfil-encabezado">
        <div>
          <h2>Mi perfil</h2>
          <p>Personaliza tus datos, tu foto y la apariencia del sistema.</p>
        </div>
      </header>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="perfil-layout">
        <aside className="perfil-tarjeta">
          <div className="perfil-tarjeta-banda">
            <span>CUENTA PERSONAL</span>
          </div>

          <div className="perfil-avatar-zona">
            <div className="perfil-avatar">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={`Foto de ${nombreCompleto}`}
                  onError={() => setFotoUrl('')}
                />
              ) : (
                <span>{iniciales(perfil.nombre, perfil.apellido)}</span>
              )}
            </div>
            <button
              type="button"
              className="perfil-camara"
              onClick={() => inputFoto.current?.click()}
              disabled={subiendo}
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto"
            >
              <IconoCamara />
            </button>
            <input
              ref={inputFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="perfil-input-foto"
              onChange={subirFoto}
            />
          </div>

          <div className="perfil-tarjeta-datos">
            <h3>{nombreCompleto || perfil.username}</h3>
            <p>{perfil.correo || perfil.username}</p>
            <span className="perfil-rol">{roles}</span>

            <div className="perfil-meta">
              <div>
                <span>MIEMBRO DESDE</span>
                <strong>{anioIngreso}</strong>
              </div>
              <div>
                <span>ESTADO</span>
                <strong>{perfil.activo ? 'Activa' : 'Inactiva'}</strong>
              </div>
            </div>

            <p className="perfil-foto-ayuda">
              {subiendo ? 'Procesando foto...' : 'JPG, PNG o WEBP · máximo 5 MB'}
            </p>

            {perfil.tiene_foto && (
              <button
                type="button"
                className="perfil-quitar-foto"
                onClick={quitarFoto}
                disabled={eliminandoFoto}
              >
                {eliminandoFoto ? 'Quitando...' : 'Quitar foto'}
              </button>
            )}
          </div>
        </aside>

        <div className="perfil-contenido">
          <form className="perfil-panel" onSubmit={guardar}>
            <header className="perfil-panel-cabecera">
              <h3>Datos personales</h3>
              <p>Actualiza el nombre con el que apareces en el sistema.</p>
            </header>

            <div className="perfil-form-grid">
              <label className="campo">
                <span>Nombre completo *</span>
                <input
                  type="text"
                  className="control"
                  required
                  maxLength={100}
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                />
              </label>

              <label className="campo">
                <span>Apellido</span>
                <input
                  type="text"
                  className="control"
                  maxLength={100}
                  value={form.apellido}
                  onChange={(e) => setForm((prev) => ({ ...prev, apellido: e.target.value }))}
                />
              </label>

              <label className="campo">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  className="control"
                  maxLength={150}
                  placeholder="usuario@ferreteria.com"
                  value={form.correo}
                  onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
                />
              </label>

              <label className="campo">
                <span>Usuario de acceso</span>
                <input
                  type="text"
                  className="control"
                  value={perfil.username}
                  readOnly
                />
                <small className="perfil-ayuda">El usuario de acceso no se puede cambiar desde aquí.</small>
              </label>
            </div>

            <div className="perfil-acciones">
              <button type="submit" className="btn btn-primario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          <section className="perfil-panel">
            <header className="perfil-panel-cabecera">
              <h3>Apariencia</h3>
              <p>La paleta institucional se mantiene en todos los módulos del sistema.</p>
            </header>

            <div className="perfil-temas">
              <div className="perfil-tema perfil-tema-activo">
                <span className="perfil-tema-icono"><IconoSol /></span>
                <div>
                  <strong>Claro institucional</strong>
                  <small>Fondos neutros y acentos naranja</small>
                </div>
                <span className="perfil-tema-check">✓</span>
              </div>

              <div className="perfil-tema perfil-tema-deshabilitado" aria-disabled="true">
                <span className="perfil-tema-icono"><IconoLuna /></span>
                <div>
                  <strong>Oscuro</strong>
                  <small>Disponible próximamente</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
