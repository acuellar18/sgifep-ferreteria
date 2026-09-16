import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const FORM_VACIO = { nombre: '', descripcion: '', acceso_total: false, activo: true };

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(null);

  async function cargarRoles() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarRoles();
  }, []);

  function abrirAlta() {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  }

  function abrirEdicion(rol) {
    setEditando(rol);
    setForm({
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      acceso_total: Boolean(rol.acceso_total),
      activo: Boolean(rol.activo)
    });
    setModalAbierto(true);
  }

  async function enviar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      acceso_total: form.acceso_total,
      activo: form.activo
    };
    try {
      if (editando) {
        await api.put(`/roles/${editando.id}`, payload);
      } else {
        await api.post('/roles', payload);
      }
      setModalAbierto(false);
      await cargarRoles();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAccion() {
    const target = confirmando;
    if (!target) return;
    setError('');
    try {
      if (target.accion === 'estado') {
        await api.patch(`/roles/${target.id}/estado`, { activo: target.activo ? 0 : 1 });
      } else if (target.accion === 'eliminar') {
        await api.delete(`/roles/${target.id}`);
      }
      setConfirmando(null);
      await cargarRoles();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Mantenimiento de roles</h2>
        <button type="button" className="btn btn-primario" onClick={abrirAlta}>+ Agregar rol</button>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando roles...</p>
      ) : roles.length === 0 ? (
        <p className="estado">No hay roles registrados.</p>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acceso total</th>
                <th>Usuarios asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol) => (
                <tr key={rol.id}>
                  <td><strong>{rol.nombre}</strong></td>
                  <td>{rol.descripcion || '—'}</td>
                  <td>{rol.acceso_total ? 'Sí' : 'No'}</td>
                  <td>{Number(rol.numero_usuarios)}</td>
                  <td>
                    <span className={`chip ${rol.activo ? 'chip-ok' : 'chip-peligro'}`}>
                      {rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-fila">
                      <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(rol)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion"
                        onClick={() => setConfirmando({ accion: 'estado', ...rol })}
                      >
                        {rol.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion btn-danger"
                        disabled={Number(rol.numero_usuarios) > 0}
                        title={Number(rol.numero_usuarios) > 0 ? 'No se puede eliminar un rol con usuarios asignados' : ''}
                        onClick={() => setConfirmando({ accion: 'eliminar', ...rol })}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modalAbierto} titulo={editando ? 'Editar rol' : 'Agregar rol'} onCerrar={() => setModalAbierto(false)} ancho="480px">
        <form onSubmit={enviar} className="formulario">
          {error && <div className="alerta alerta-error">{error}</div>}
          <label className="campo">
            <span>Nombre *</span>
            <input
              type="text"
              className="control"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </label>
          <label className="campo">
            <span>Descripción</span>
            <textarea
              className="control"
              rows="3"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>
          <label className="campo campo-check">
            <input
              type="checkbox"
              checked={form.acceso_total}
              onChange={(e) => setForm({ ...form, acceso_total: e.target.checked })}
            />
            Acceso total al sistema
          </label>
          <label className="campo campo-check">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Rol activo
          </label>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear rol'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar rol' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar permanentemente el rol "${confirmando?.nombre}"?`
            : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} el rol "${confirmando?.nombre}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}