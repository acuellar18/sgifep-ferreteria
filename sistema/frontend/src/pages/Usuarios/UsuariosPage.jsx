import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { leerSesion } from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
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

const PAGE_SIZE = 10;

export default function UsuariosPage() {
  const navigate = useNavigate();
  const notificar = useNotificacion();

  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'creado_en', sortDir: 'desc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const temporizadorBusqueda = useRef(null);

  // Solo administradores o superadmin ven las acciones de escritura
  // (editar, inactivar/activar, eliminar y alta). Esto evita que un
  // usuario con rol como "bodega" vea botones que el backend rechaza
  // con 403, generando el "error en manejo de roles".
  const sesion = leerSesion();
  const esAdmin = sesion?.superadmin || sesion?.roles?.includes('administrador');

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarUsuarios = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/usuarios', { params });
      setUsuarios(res.data);
      const nuevoTotal = res.total ?? res.data.length;
      setTotal(nuevoTotal);

      // Si la página actual quedó fuera de rango (p. ej. al eliminar el último
      // registro de la última página), se vuelve a la última página válida; el
      // efecto de [pagina] dispara la recarga con el valor corregido.
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) {
        setPagina(ultimaPagina);
      }
    } catch (err) {
      setUsuarios([]);
      setTotal(0);
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
  }, [cargarOpciones]);

  // Cualquier cambio de página u orden recarga el listado con los filtros
  // ya aplicados (no dispara aplicarFiltros: solo cambia page/sortBy/sortDir).
  // También se recarga al volver a esta ruta (location.pathname cambia)
  // para evitar que la lista quede estancada.
  const location = useLocation();
  useEffect(() => {
    cargarUsuarios(filtros, pagina, orden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pagina, orden]);

  // Búsqueda en tiempo real: al escribir se consulta solo tras una pausa de
  // 400 ms (debounce) para no disparar peticiones por cada tecla. Al buscar,
  // siempre se vuelve a la página 1 (una búsqueda nueva invalida la posición
  // de paginación anterior).
  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => {
        setPagina(1);
        cargarUsuarios(nuevos, 1, orden);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    setPagina(1);
    cargarUsuarios(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    cargarUsuarios(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
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
        notificar.exito(target.activo ? 'Usuario inactivado' : 'Usuario activado');
      } else if (target.accion === 'eliminar') {
        await api.delete(`/usuarios/${target.id}`);
        notificar.exito('Usuario eliminado correctamente');
      }
      setConfirmando(null);
      await cargarUsuarios(filtros, pagina, orden);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Usuario guardado correctamente');
    await cargarUsuarios(filtros, pagina, orden);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-GT');
  }

  // Exporta el listado actual (la página visible, ya filtrada) a CSV.
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

  // Lleva al reporte unificado (/usuarios/reporte) con los MISMOS filtros que
  // se están viendo aquí, para que el reporte y el listado nunca se
  // desincronicen (antes había dos "reportes" separados e inconsistentes).
  function irAlReporte() {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
        params.set(clave, valor);
      }
    }
    const query = params.toString();
    navigate(query ? `/reporte?${query}` : '/reporte');
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Listado de usuarios</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={irAlReporte}>
            Reporte de Usuarios
          </button>
          {usuarios.length > 0 && (
            <button type="button" className="btn btn-secundario" onClick={exportarCsv}>
              Exportar CSV
            </button>
          )}
          {esAdmin && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>+ Agregar usuario nuevo</button>
          )}
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
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="codigo" ordenActual={orden} onOrdenar={cambiarOrden}>Código</ThOrdenable>
                  <ThOrdenable columna="nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Nombre completo</ThOrdenable>
                  <ThOrdenable columna="username" ordenActual={orden} onOrdenar={cambiarOrden}>Usuario</ThOrdenable>
                  <ThOrdenable columna="departamento_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Departamento</ThOrdenable>
                  <th>Roles</th>
                  <th>Estado</th>
                  <ThOrdenable columna="creado_en" ordenActual={orden} onOrdenar={cambiarOrden}>Creado</ThOrdenable>
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
                      {esAdmin && (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={total} onCambiar={setPagina} />
        </>
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
