import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  codigo: '',
  username: '',
  password: '',
  departamento_id: '',
  roles: [],
  activo: true
};

// Modal de alta/edición de usuario.
// Departamentos y roles SIEMPRE se cargan desde la API (fetch real), nunca
// quedan hardcodeados en <option>. Si el padre ya los cargó se reutilizan;
// si vienen vacíos, este modal los solicita por su cuenta.
export default function UsuarioFormModal({ abierto, usuario, onCerrar, onGuardado, departamentos, roles }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esAlta = !usuario;

  const departamentosVisibles = departamentos.length > 0 ? departamentos : (opciones?.departamentos || []);
  const rolesVisibles = roles.length > 0 ? roles : (opciones?.roles || []);
  const cargandoOpciones = departamentos.length === 0 && roles.length === 0 && !opciones;

  useEffect(() => {
    if (!abierto) return;
    setError('');
    setOpciones(null);

    // Carga dinámica: si el padre no provee roles/departamentos (carga 100%
    // real desde la API), se consultan aquí al abrir el modal.
    if (departamentos.length === 0 || roles.length === 0) {
      Promise.all([api.get('/departamentos?estado=activo'), api.get('/roles?estado=activo')])
        .then(([resDeptos, resRoles]) => {
          setOpciones({ departamentos: resDeptos.data, roles: resRoles.data });
        })
        .catch((err) => setError(err.message));
    }
  }, [abierto, usuario, departamentos, roles]);

  useEffect(() => {
    if (!abierto) return;

    if (usuario) {
      setForm({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        codigo: usuario.codigo || '',
        username: usuario.username || '',
        password: '',
        departamento_id: usuario.departamento_id || '',
        roles: usuario.roles?.map((r) => r.id) || [],
        activo: Boolean(usuario.activo)
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [abierto, usuario]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function alternarRol(id) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(id)
        ? prev.roles.filter((rid) => rid !== id)
        : [...prev.roles, id]
    }));
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim() || null,
      codigo: form.codigo.trim(),
      username: form.username.trim(),
      departamento_id: form.departamento_id || null,
      roles: form.roles,
      activo: form.activo
    };
    if (form.password) {
      payload.password = form.password;
    }
    if (esAlta) {
      payload.password = form.password;
    }

    try {
      if (esAlta) {
        await api.post('/usuarios', payload);
        onGuardado('Usuario creado correctamente');
      } else {
        await api.put(`/usuarios/${usuario.id}`, payload);
        onGuardado('Usuario actualizado correctamente');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={esAlta ? 'Agregar usuario' : 'Editar usuario'} onCerrar={onCerrar} ancho="640px">
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-grid">
          <label className="campo">
            <span>Nombre *</span>
            <input
              type="text"
              className="control"
              required
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Apellido</span>
            <input
              type="text"
              className="control"
              value={form.apellido}
              onChange={(e) => actualizarCampo('apellido', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Código *</span>
            <input
              type="text"
              className="control"
              required
              value={form.codigo}
              onChange={(e) => actualizarCampo('codigo', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Nombre de usuario *</span>
            <input
              type="text"
              className="control"
              required
              autoComplete="username"
              value={form.username}
              onChange={(e) => actualizarCampo('username', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>{esAlta ? 'Contraseña *' : 'Contraseña (dejar vacío para no cambiar)'}</span>
            <input
              type="password"
              className="control"
              autoComplete="new-password"
              required={esAlta}
              value={form.password}
              onChange={(e) => actualizarCampo('password', e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Departamento</span>
            <select
              className="control"
              value={form.departamento_id || ''}
              onChange={(e) => actualizarCampo('departamento_id', e.target.value)}
              disabled={cargandoOpciones}
            >
              <option value="">Sin departamento</option>
              {departamentosVisibles.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="campo">
          <span>Roles (puede elegir uno o varios) *</span>
          <div className="roles-check">
            {cargandoOpciones ? (
              <p className="estado">Cargando roles...</p>
            ) : rolesVisibles.length === 0 ? (
              <p className="estado">No hay roles disponibles.</p>
            ) : (
              rolesVisibles.map((rol) => (
                <label key={rol.id} className="check-rol">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(rol.id)}
                    onChange={() => alternarRol(rol.id)}
                  />
                  {rol.nombre}
                  {(rol.acceso_total || rol.superadmin) && <span className="chip chip-ok">acceso total</span>}
                </label>
              ))
            )}
          </div>
        </div>

        <label className="campo campo-check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => actualizarCampo('activo', e.target.checked)}
          />
          Usuario activo
        </label>

        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : esAlta ? 'Crear usuario' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}