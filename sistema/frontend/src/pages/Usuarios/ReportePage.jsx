import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos',
  departamento: '',
  rol: '',
  startDate: '',
  endDate: ''
};

// Reporte "inteligente": un único lugar de verdad para reportes de usuarios.
// Antes existían dos reportes desconectados (esta página, con estadísticas
// globales sin filtro, y un modal en el Listado con la tabla ya filtrada
// pero sin estadísticas). Ahora ambos casos se resuelven aquí: mismos
// filtros que el Listado (búsqueda, estado, departamento, rol, fechas),
// aplicados tanto a los totales como a los desgloses.
export default function ReportePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const notificar = useNotificacion();

  // Los filtros iniciales se leen de la URL para que el enlace "Reporte de
  // Usuarios" del Listado llegue aquí con el mismo criterio ya aplicado.
  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_INICIALES,
    ...Object.fromEntries(searchParams.entries())
  }));
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null); // { tipo: 'departamento'|'rol', id, nombre, usuarios, cargando }
  const temporizadorBusqueda = useRef(null);

  const cargarReporte = useCallback(async (filtrosActuales) => {
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/usuarios/reporte', { params });
      setReporte(res.data);
    } catch (err) {
      setReporte(null);
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
    cargarReporte(filtros);
    // Solo se ejecuta al montar: los filtros iniciales ya vienen de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sincronizarUrl(nuevos) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(nuevos)) {
      if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
        params.set(clave, valor);
      }
    }
    setSearchParams(params, { replace: true });
  }

  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => {
        sincronizarUrl(nuevos);
        cargarReporte(nuevos);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    sincronizarUrl(filtros);
    cargarReporte(filtros);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    sincronizarUrl(FILTROS_INICIALES);
    cargarReporte(FILTROS_INICIALES);
  }

  // Modal de detalle: al hacer clic en una fila de "por departamento" o "por
  // rol" se listan los usuarios activos de esa categoría, respetando además
  // el resto de filtros ya aplicados (fecha, búsqueda, etc.).
  async function verDetalle(tipo, id, nombre) {
    setDetalle({ tipo, id, nombre, usuarios: [], cargando: true });
    try {
      const params = { estado: 'activo' };
      for (const [clave, valor] of Object.entries(filtros)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined && clave !== 'estado') {
          params[clave] = valor;
        }
      }
      params[tipo === 'departamento' ? 'departamento' : 'rol'] = id;
      const res = await api.get('/usuarios', { params: { ...params, pageSize: 100 } });
      setDetalle({ tipo, id, nombre, usuarios: res.data, cargando: false });
    } catch (err) {
      notificar.error(err.message);
      setDetalle(null);
    }
  }

  // Exporta ambos bloques del reporte (con los filtros ya aplicados) a CSV.
  function exportarCsv() {
    if (!reporte) return;
    const { totales, porDepartamento, porRol } = reporte;
    const filas = [
      {
        Seccion: 'TOTALES',
        Nombre: 'General',
        Detalle: `${totales.total} usuarios (${totales.activos} activos, ${totales.inactivos} inactivos)`,
        Activos: Number(totales.activos)
      },
      ...porDepartamento.map((d) => ({
        Seccion: 'POR DEPARTAMENTO',
        Nombre: d.nombre,
        Detalle: '',
        Activos: Number(d.total_activos)
      })),
      ...porRol.map((r) => ({
        Seccion: 'POR ROL',
        Nombre: r.nombre,
        Detalle: r.acceso_total ? 'Acceso total' : '',
        Activos: Number(r.total_activos)
      }))
    ];
    exportarCSV(filas, `reporte_usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <section className="reporte-imprimible">
      <div className="encabezado-pagina">
        <h2>Reporte de usuarios</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={() => window.print()}>
            Imprimir
          </button>
          <button type="button" className="btn btn-primario" onClick={exportarCsv} disabled={!reporte}>
            Exportar CSV
          </button>
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
        <p className="estado">Cargando reporte...</p>
      ) : reporte ? (
        <>
          <div className="tarjetas">
            <div className="tarjeta">
              <span className="tarjeta-valor">{reporte.totales.total}</span>
              <span className="tarjeta-etiqueta">Total de usuarios (según filtros)</span>
            </div>
            <div className="tarjeta tarjeta-ok">
              <span className="tarjeta-valor">{reporte.totales.activos}</span>
              <span className="tarjeta-etiqueta">Activos</span>
            </div>
            <div className="tarjeta tarjeta-peligro">
              <span className="tarjeta-valor">{reporte.totales.inactivos}</span>
              <span className="tarjeta-etiqueta">Inactivos</span>
            </div>
          </div>

          <p className="reporte-nota">
            Haz clic en una fila para ver el detalle de esos usuarios.
          </p>

          <div className="reporte-grid">
            <div>
              <h3>Usuarios activos por departamento</h3>
              {reporte.porDepartamento.length === 0 ? (
                <p className="estado">Sin datos.</p>
              ) : (
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Departamento</th>
                        <th>Activos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.porDepartamento.map((d) => (
                        <tr
                          key={d.id}
                          className="fila-clicable"
                          onClick={() => verDetalle('departamento', d.id, d.nombre)}
                        >
                          <td>{d.nombre}</td>
                          <td>{Number(d.total_activos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3>Usuarios activos por rol</h3>
              {reporte.porRol.length === 0 ? (
                <p className="estado">Sin datos.</p>
              ) : (
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Rol</th>
                        <th>Acceso total</th>
                        <th>Activos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.porRol.map((r) => (
                        <tr
                          key={r.id}
                          className="fila-clicable"
                          onClick={() => verDetalle('rol', r.id, r.nombre)}
                        >
                          <td>{r.nombre}</td>
                          <td>{r.acceso_total ? 'Sí' : 'No'}</td>
                          <td>{Number(r.total_activos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <Modal
        abierto={Boolean(detalle)}
        titulo={detalle ? `Usuarios activos · ${detalle.tipo === 'departamento' ? 'Departamento' : 'Rol'}: ${detalle.nombre}` : ''}
        onCerrar={() => setDetalle(null)}
        ancho="700px"
      >
        {detalle?.cargando ? (
          <p className="estado">Cargando usuarios...</p>
        ) : !detalle || detalle.usuarios.length === 0 ? (
          <p className="estado">No hay usuarios activos en esta categoría con los filtros aplicados.</p>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre completo</th>
                  <th>Usuario</th>
                  <th>Departamento</th>
                </tr>
              </thead>
              <tbody>
                {detalle.usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.codigo || '—'}</td>
                    <td>{`${u.nombre} ${u.apellido || ''}`.trim()}</td>
                    <td>{u.username}</td>
                    <td>{u.departamento_nombre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </section>
  );
}
