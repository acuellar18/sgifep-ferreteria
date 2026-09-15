import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import UsuarioFormModal from './UsuarioFormModal';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos',
  departamento: '',
  rol: '',
  fechaInicio: '',
  fechaFin: ''
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  const cargarUsuarios = useCallback(async (filtrosActuales) => {
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/usuarios', { params });
      setUsuarios(res.data);
    } catch (err) {
      setUsuarios([]);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarOpciones = useCallback(async () => {
    const [resDeptos, resRoles] = await Promise.all([
      api.get('/departamentos?estado=activo'),
      api.get('/roles?estado=activo')
    ]);
    setDepartamentos(resDeptos.data);
    setRoles(resRoles.data);
  }, []);

  useEffect(() => {
    cargarOpciones().catch((e) => setError(e.message));
    cargarUsuarios(FILTROS_INICIALES);
  }, [cargarOpciones, cargarUsuarios]);

  function aplicarFiltros(e) {
    e.preventDefault();
    cargarUsuarios(filtros);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    cargarUsuarios(FILTROS_INICIALES);
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(usuario) {
    setEditando(usuario);
    setModalAbierto(true);
  }

  async function confirmarAccion() {
    const target = confirmando;
    if (!target) return;
    setError('');
    try {
      if (target.accion === 'estado') {
        await api.patch(`/usuarios/${target.id}/estado`, { activo: target.activo ? 0 : 1 });
      } else if (target.accion === 'eliminar') {
        await api.delete(`/usuarios/${target.id}`);
      }
      setConfirmando(null);
      await cargarUsuarios(filtros);
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar() {
    setModalAbierto(false);
    setEditando(null);
    await cargarUsuarios(filtros);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-GT');
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Listado de usuarios</h2>
        <button type="button" className="btn btn-primario" onClick={abrirAlta}>+ Agregar usuario</button>
      </div>

      <FilterBar
        filtros={filtros}
        departamentos={departamentos}
        roles={roles}
        onChange={setFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      />

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p className="estado">No se encontraron usuarios con los filtros aplicados.</p>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre completo</th>
                <th>Usuario</th>
                <th>Departamento</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.codigo || '—'}</td>
                  <td>{`${usuario.nombre} ${usuario.apellido || ''}`.trim()}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.departamento_nombre || '—'}</td>
                  <td>
                    <div className="roles-chips">
                      {usuario.roles.length === 0 ? (
                        <span className="chip chip-transparente">sin rol</span>
                      ) : (
                        usuario.roles.map((rol) => (
                          <span key={rol.id} className="chip">{rol.nombre}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${usuario.activo ? 'chip-ok' : 'chip-peligro'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatearFecha(usuario.creado_en)}</td>
                  <td>
                    <div className="acciones-fila">
                      <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(usuario)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion"
                        onClick={() => setConfirmando({ accion: 'estado', ...usuario })}
                      >
                        {usuario.activo ? 'Inactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-opcion btn-danger"
                        onClick={() => setConfirmando({ accion: 'eliminar', ...usuario })}
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

      <UsuarioFormModal
        abierto={modalAbierto}
        usuario={editando}
        onCerrar={() => {
          setModalAbierto(false);
          setEditando(null);
        }}
        onGuardado={alGuardar}
        departamentos={departamentos}
        roles={roles}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar usuario' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar permanentemente a "${confirmando?.nombre} ${confirmando?.apellido || ''}"? Esta acción no se puede deshacer.`
            : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} al usuario "${confirmando?.nombre} ${confirmando?.apellido || ''}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}