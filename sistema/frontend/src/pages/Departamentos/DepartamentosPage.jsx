import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const FORM_VACIO = { nombre: '', descripcion: '', activo: true };

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(null);

  async function cargarDepartamentos() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/departamentos');
      setDepartamentos(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  function abrirAlta() {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  }

  function abrirEdicion(depto) {
    setEditando(depto);
    setForm({
      nombre: depto.nombre || '',
      descripcion: depto.descripcion || '',
      activo: Boolean(depto.activo)
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
      activo: form.activo
    };
    try {
      if (editando) {
        await api.put(`/departamentos/${editando.id}`, payload);
      } else {
        await api.post('/departamentos', payload);
      }
      setModalAbierto(false);
      await cargarDepartamentos();
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
        await api.patch(`/departamentos/${target.id}/estado`, { activo: target.activo ? 0 : 1 });
      } else if (target.accion === 'eliminar') {
        await api.delete(`/departamentos/${target.id}`);
      }
      setConfirmando(null);
      await cargarDepartamentos();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Mantenimiento de departamentos</h2>
        <button type="button" className="btn btn-primario" onClick={abrirAlta}>+ Agregar departamento</button>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando departamentos...</p>
      ) : departamentos.length === 0 ? (
        <p className="estado">No hay departamentos registrados.</p>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Usuarios asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {departamentos.map((depto) => (
                <tr key={depto.id}>
                  <td><strong>{depto.nombre}</strong></td>
                  <td>{depto.descripcion || '—'}</td>
                  <td>{Number(depto.numero_usuarios)}</td>
                  <td>
                    <span className={`chip ${depto.activo ? 'chip-ok' : 'chip-peligro'}`}>
                      {depto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="acciones-fila">
                      <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(depto)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion"
                        onClick={() => setConfirmando({ accion: 'estado', ...depto })}
                      >
                        {depto.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion btn-danger"
                        disabled={Number(depto.numero_usuarios) > 0}
                        title={Number(depto.numero_usuarios) > 0 ? 'No se puede eliminar un departamento con usuarios asignados' : ''}
                        onClick={() => setConfirmando({ accion: 'eliminar', ...depto })}
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

      <Modal abierto={modalAbierto} titulo={editando ? 'Editar departamento' : 'Agregar departamento'} onCerrar={() => setModalAbierto(false)} ancho="480px">
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
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Departamento activo
          </label>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear departamento'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar departamento' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar permanentemente el departamento "${confirmando?.nombre}"?`
            : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} el departamento "${confirmando?.nombre}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}