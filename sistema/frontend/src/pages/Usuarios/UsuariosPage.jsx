import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import UsuarioFormModal from './UsuarioFormModal';
import exportarCSV from '../../utils/csv';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos',
  departamento: '',
  rol: '',
  startDate: '',
  endDate: ''
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
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const temporizadorBusqueda = useRef(null);

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

  // Búsqueda en tiempo real: al escribir se consulta solo tras una pausa de
  // 400 ms (debounce) para no disparar peticiones por cada tecla.
  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => cargarUsuarios(nuevos), 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  // Habilita la impresión solo del modal del reporte (ver CSS @media print).
  useEffect(() => {
    if (reporteAbierto) {
      document.body.classList.add('imprimo-modal');
    } else {
      document.body.classList.remove('imprimo-modal');
    }
  }, [reporteAbierto]);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
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

  // Exporta el listado actual (ya filtrado) a CSV con cabeceras legibles.
  function exportarCsv() {
    const filas = usuarios.map((usuario) => ({
      Codigo: usuario.codigo || '',
      Nombre: `${usuario.nombre} ${usuario.apellido || ''}`.trim(),
      Usuario: usuario.username || '',
      Departamento: usuario.departamento_nombre || '',
      Roles: usuario.roles.map((r) => r.nombre).join(', '),
      Estado: usuario.activo ? 'Activo' : 'Inactivo',
      Creado: formatearFecha(usuario.creado_en)
    }));
    exportarCSV(filas, `usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Listado de usuarios</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={() => setReporteAbierto(true)}>
            Reporte de Usuarios
          </button>
          {usuarios.length > 0 && (
            <button type="button" className="btn btn-secundario" onClick={exportarCsv}>
              Exportar CSV
            </button>
          )}
          <button type="button" className="btn btn-primario" onClick={abrirAlta}>+ Agregar usuario nuevo</button>
        </div>
      </div>

      <FilterBar
        filtros={filtros}
        departamentos={departamentos}
        roles={roles}
        onChange={cambiarFiltros}
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

      <Modal
        abierto={reporteAbierto}
        titulo="Reporte de usuarios (filtros aplicados)"
        onCerrar={() => setReporteAbierto(false)}
        ancho="900px"
      >
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={() => window.print()}>
            Imprimir
          </button>
          <button type="button" className="btn btn-primario" onClick={exportarCsv}>
            Exportar CSV
          </button>
        </div>
        <p className="reporte-detalle">
          Usuarios encontrados: <strong>{usuarios.length}</strong>. Puede imprimir esta vista o
          exportarla a CSV con los filtros ya aplicados.
        </p>
        {usuarios.length === 0 ? (
          <p className="estado">No hay usuarios que coincidan con los filtros aplicados.</p>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

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