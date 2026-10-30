import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import { formatearFechaHora } from '../../utils/formatos';

function fechaLocal(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function filtrosIniciales() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { q: '', accion: '', desde: fechaLocal(inicio), hasta: fechaLocal(hoy) };
}

export default function AuditoriaPage() {
  const notificar = useNotificacion();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [aplicados, setAplicados] = useState(filtrosIniciales);
  const [data, setData] = useState({ data: [], total: 0, page: 1, pageSize: 25 });
  const [acciones, setAcciones] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, hoy: 0, usuarios: 0 });
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = { ...aplicados, page: pagina, pageSize: 25 };
      const [res, resAcciones, resResumen] = await Promise.all([
        api.get('/auditoria', { params }),
        api.get('/auditoria/acciones'),
        api.get('/auditoria/resumen')
      ]);
      setData({
        data: res.data || [],
        total: Number(res.total || 0),
        page: Number(res.page || 1),
        pageSize: Number(res.pageSize || 25)
      });
      setAcciones(resAcciones.data || []);
      setResumen(resResumen.data || { total: 0, hoy: 0, usuarios: 0 });
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setCargando(false);
    }
  }, [aplicados, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicar(evento) {
    evento.preventDefault();
    setPagina(1);
    setAplicados({ ...filtros });
  }

  function exportar() {
    const filas = data.data.map((evento) => ({
      Fecha: evento.creado_en,
      Usuario: evento.username || evento.usuario_nombre || '',
      Acción: evento.accion,
      Entidad: evento.entidad || '',
      'ID entidad': evento.entidad_id || '',
      Descripción: evento.descripcion || '',
      IP: evento.ip || ''
    }));
    if (exportarCSV(filas, `auditoria-${aplicados.desde}-${aplicados.hasta}.csv`)) {
      notificar.exito('Auditoría exportada');
    } else {
      notificar.error('No hay datos para exportar');
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <section className="auditoria">
      <header className="reporte-ventas-encabezado">
        <div>
          <h2>Auditoría</h2>
          <p>Registro de acciones sensibles: ventas, cobros, devoluciones, cierres y accesos.</p>
        </div>
        <button type="button" className="btn btn-secundario" onClick={exportar}>Exportar CSV</button>
      </header>

      <div className="reporte-resumen">
        <article>
          <span>Eventos totales</span>
          <strong>{resumen.total}</strong>
          <small>Histórico</small>
        </article>
        <article>
          <span>Eventos de hoy</span>
          <strong>{resumen.hoy}</strong>
          <small>Acciones registradas</small>
        </article>
        <article>
          <span>Usuarios</span>
          <strong>{resumen.usuarios}</strong>
          <small>Con actividad registrada</small>
        </article>
      </div>

      <form className="reporte-filtros" onSubmit={aplicar}>
        <label className="campo">
          <span>Buscar</span>
          <input
            type="search"
            className="control"
            value={filtros.q}
            onChange={(e) => cambiar('q', e.target.value)}
            placeholder="Usuario, entidad o descripción"
          />
        </label>
        <label className="campo">
          <span>Acción</span>
          <select
            className="control"
            value={filtros.accion}
            onChange={(e) => cambiar('accion', e.target.value)}
          >
            <option value="">Todas</option>
            {acciones.map((accion) => (
              <option key={accion.accion} value={accion.accion}>
                {accion.accion} ({accion.total})
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Desde</span>
          <input type="date" className="control" value={filtros.desde} onChange={(e) => cambiar('desde', e.target.value)} />
        </label>
        <label className="campo">
          <span>Hasta</span>
          <input type="date" className="control" value={filtros.hasta} onChange={(e) => cambiar('hasta', e.target.value)} />
        </label>
        <div className="reporte-filtros-acciones">
          <button type="submit" className="btn btn-primario">Aplicar</button>
        </div>
      </form>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="tabla-wrapper">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Descripción</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className="tabla-vacia">Cargando auditoría...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan="6" className="tabla-vacia">No hay eventos para los filtros seleccionados.</td></tr>
            ) : (
              data.data.map((evento) => (
                <tr key={evento.id}>
                  <td>{formatearFechaHora(evento.creado_en)}</td>
                  <td>{evento.usuario_nombre || evento.username || 'Sistema'}</td>
                  <td><code>{evento.accion}</code></td>
                  <td>
                    {evento.entidad || '—'}
                    {evento.entidad_id ? ` #${evento.entidad_id}` : ''}
                  </td>
                  <td>{evento.descripcion || '—'}</td>
                  <td>{evento.ip || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pos-paginacion">
        <span>
          {data.total === 0
            ? 'Sin resultados'
            : `Mostrando ${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} de ${data.total}`}
        </span>
        <div>
          <button type="button" className="btn btn-secundario btn-mini" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>
            Anterior
          </button>
          <span className="pos-pagina">Página {pagina} de {totalPaginas}</span>
          <button type="button" className="btn btn-secundario btn-mini" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas}>
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
