import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import { formatearFechaHora, formatearNumero } from '../../utils/formatos';
import { permisosInventario } from '../../utils/permisosInventario';
import MovimientoFormModal from './MovimientoFormModal';

const PAGE_SIZE = 12;

const ETIQUETAS_TIPO = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste'
};

function numeroCantidad(valor) {
  const numero = Number(valor || 0);
  return formatearNumero(numero, Number.isInteger(numero) ? 0 : 2);
}

function cantidadConSigno(movimiento) {
  const diferencia = Number(movimiento.diferencia || 0);
  const signo = diferencia > 0 ? '+' : diferencia < 0 ? '−' : '';
  return `${signo}${numeroCantidad(Math.abs(diferencia))}`;
}

function IconoBuscar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconoEntrada() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function IconoSalida() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}

function IconoAjuste() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h10" />
      <path d="m11 5 3 3-3 3" />
      <path d="M20 16H10" />
      <path d="m13 13-3 3 3 3" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function MovimientosPage() {
  const notificar = useNotificacion();
  const permisos = permisosInventario();
  const solicitudActual = useRef(0);
  const primeraBusqueda = useRef(true);

  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [usuario, setUsuario] = useState('');
  const [usuarioAplicado, setUsuarioAplicado] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortDir, setSortDir] = useState('desc');
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Boolean(
    busquedaAplicada || usuarioAplicado || tipo || fechaDesde || fechaHasta
  );

  const cargarMovimientos = useCallback(async () => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = { page: pagina, pageSize: PAGE_SIZE, sortBy, sortDir };
      if (busquedaAplicada) params.q = busquedaAplicada;
      if (usuarioAplicado) params.usuario = usuarioAplicado;
      if (tipo) params.tipo = tipo;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await api.get('/movimientos-inventario', { params });
      if (solicitud !== solicitudActual.current) return;
      const data = res.data || [];
      setMovimientos(data);
      const nuevoTotal = Number(res.total ?? data.length);
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (pagina > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setMovimientos([]);
      setTotal(0);
      setError(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, [
    pagina,
    busquedaAplicada,
    usuarioAplicado,
    tipo,
    fechaDesde,
    fechaHasta,
    sortBy,
    sortDir,
    recarga
  ]);

  const cargarResumen = useCallback(async () => {
    try {
      const res = await api.get('/movimientos-inventario/resumen');
      setResumen(res.data || null);
    } catch {
      setResumen(null);
    }
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  useEffect(() => {
    if (primeraBusqueda.current) {
      primeraBusqueda.current = false;
      return undefined;
    }
    const temporizador = window.setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setUsuarioAplicado(usuario.trim());
      setPagina(1);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda, usuario]);

  function refrescar() {
    setRecarga((valor) => valor + 1);
    cargarResumen();
  }

  function limpiarFiltros() {
    setBusqueda('');
    setBusquedaAplicada('');
    setUsuario('');
    setUsuarioAplicado('');
    setTipo('');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  }

  function cambiarOrden(columna, direccion) {
    setSortBy(columna);
    setSortDir(direccion);
    setPagina(1);
  }

  function alGuardar(mensaje) {
    setModalAbierto(false);
    notificar.exito(mensaje || 'Movimiento registrado correctamente');
    refrescar();
  }

  function exportar() {
    if (movimientos.length === 0) {
      notificar.error('No hay movimientos para exportar');
      return;
    }

    const filas = movimientos.map((movimiento) => ({
      Fecha: formatearFechaHora(movimiento.creado_en),
      Producto: movimiento.producto_nombre,
      Código: movimiento.producto_codigo || '',
      Tipo: ETIQUETAS_TIPO[movimiento.tipo] || movimiento.tipo,
      Cantidad: numeroCantidad(movimiento.cantidad),
      Diferencia: cantidadConSigno(movimiento),
      'Stock anterior': numeroCantidad(movimiento.stock_anterior),
      'Stock nuevo': numeroCantidad(movimiento.stock_nuevo),
      Motivo: movimiento.motivo,
      Referencia: movimiento.referencia || '',
      Observaciones: movimiento.observaciones || '',
      Usuario: movimiento.usuario_nombre || movimiento.usuario_username || ''
    }));

    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    exportarCSV(filas, `movimientos-inventario-${fecha}.csv`);
  }

  const ultimo = resumen?.ultimo;

  return (
    <section className="inventario-movimientos">
      <header className="inventario-encabezado">
        <div>
          <h2>Movimientos de inventario</h2>
          <p className="reporte-detalle">
            Historial de entradas, salidas y ajustes que modifican el stock.
          </p>
        </div>
        <div className="inventario-acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={exportar}>
            Exportar CSV
          </button>
          {permisos.ajustarInventario && (
            <button type="button" className="btn btn-primario" onClick={() => setModalAbierto(true)}>
              + Registrar movimiento
            </button>
          )}
        </div>
      </header>

      <div className="inventario-estadisticas">
        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono inventario-icono-entrada"><IconoEntrada /></span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearNumero(resumen.entradas?.movimientos, 0) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Entradas este mes</span>
            <span className="movimiento-stat-detalle">
              {resumen ? `${numeroCantidad(resumen.entradas?.unidades)} unidades` : ' '}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono inventario-icono-salida"><IconoSalida /></span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearNumero(resumen.salidas?.movimientos, 0) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Salidas este mes</span>
            <span className="movimiento-stat-detalle">
              {resumen ? `${numeroCantidad(resumen.salidas?.unidades)} unidades` : ' '}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono inventario-icono-ajuste"><IconoAjuste /></span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearNumero(resumen.ajustes?.movimientos, 0) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Ajustes este mes</span>
            <span className="movimiento-stat-detalle">
              {resumen ? `${numeroCantidad(resumen.ajustes?.unidades)} unidades` : ' '}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono inventario-icono-ultimo"><IconoReloj /></span>
          <div>
            <span className="inventario-estadistica-valor movimiento-stat-fecha">
              {ultimo ? formatearFechaHora(ultimo.creado_en) : 'Sin movimientos'}
            </span>
            <span className="inventario-estadistica-etiqueta">Último movimiento</span>
            <span className="movimiento-stat-detalle">
              {ultimo
                ? `${ETIQUETAS_TIPO[ultimo.tipo] || ultimo.tipo} · ${ultimo.producto_nombre}`
                : ' '}
            </span>
          </div>
        </div>
      </div>

      <div className="inventario-toolbar inventario-toolbar-movimientos">
        <div className="inventario-buscador">
          <span className="inventario-buscador-icono"><IconoBuscar /></span>
          <input
            type="search"
            className="control"
            placeholder="Buscar producto, código o referencia..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar movimientos"
          />
          {busqueda && (
            <button
              type="button"
              className="inventario-buscador-limpiar"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="control"
          value={tipo}
          onChange={(evento) => { setTipo(evento.target.value); setPagina(1); }}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>

        <label className="movimiento-filtro-fecha">
          <span>Desde</span>
          <input
            type="date"
            className="control"
            value={fechaDesde}
            onChange={(evento) => { setFechaDesde(evento.target.value); setPagina(1); }}
          />
        </label>

        <label className="movimiento-filtro-fecha">
          <span>Hasta</span>
          <input
            type="date"
            className="control"
            value={fechaHasta}
            onChange={(evento) => { setFechaHasta(evento.target.value); setPagina(1); }}
          />
        </label>

        <input
          type="search"
          className="control movimiento-filtro-usuario"
          placeholder="Usuario"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          aria-label="Filtrar por usuario"
        />
      </div>

      {hayFiltros && (
        <div className="inventario-filtro-activo">
          <span>Filtros aplicados</span>
          <button type="button" className="btn btn-opcion" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      )}

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="inventario-listado">
        {cargando ? (
          <p className="estado">Cargando movimientos...</p>
        ) : movimientos.length === 0 ? (
          <div className="inventario-vacio">
            <p>
              {hayFiltros
                ? 'No se encontraron movimientos con los filtros seleccionados.'
                : 'Todavía no hay movimientos registrados.'}
            </p>
            {permisos.ajustarInventario && !hayFiltros && (
              <button type="button" className="btn btn-primario" onClick={() => setModalAbierto(true)}>
                + Registrar movimiento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table className="tabla tabla-movimientos">
                <thead>
                  <tr>
                    <ThOrdenable columna="fecha" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Fecha
                    </ThOrdenable>
                    <ThOrdenable columna="producto" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Producto
                    </ThOrdenable>
                    <ThOrdenable columna="tipo" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Tipo
                    </ThOrdenable>
                    <ThOrdenable columna="cantidad" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Cantidad
                    </ThOrdenable>
                    <th>Stock</th>
                    <ThOrdenable columna="motivo" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Motivo
                    </ThOrdenable>
                    <ThOrdenable columna="usuario" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
                      Usuario
                    </ThOrdenable>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td className="movimiento-celda-fecha">
                        {formatearFechaHora(movimiento.creado_en)}
                      </td>
                      <td>
                        <div className="movimiento-producto-celda">
                          <strong>{movimiento.producto_nombre}</strong>
                          <small>{movimiento.producto_codigo}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`movimiento-badge movimiento-badge-${movimiento.tipo}`}>
                          {ETIQUETAS_TIPO[movimiento.tipo] || movimiento.tipo}
                        </span>
                      </td>
                      <td>
                        <span className={`movimiento-cantidad movimiento-cantidad-${movimiento.tipo}`}>
                          {cantidadConSigno(movimiento)}
                        </span>
                        <small className="movimiento-celda-unidad">
                          {movimiento.unidad_medida || 'UNI'}
                        </small>
                      </td>
                      <td className="movimiento-celda-stock">
                        <span>{numeroCantidad(movimiento.stock_anterior)}</span>
                        <span aria-hidden="true"> → </span>
                        <strong>{numeroCantidad(movimiento.stock_nuevo)}</strong>
                      </td>
                      <td>
                        <span>{movimiento.motivo}</span>
                        {movimiento.referencia && (
                          <small className="movimiento-celda-referencia">
                            Ref. {movimiento.referencia}
                          </small>
                        )}
                      </td>
                      <td>{movimiento.usuario_nombre || movimiento.usuario_username || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Paginacion
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>

      <MovimientoFormModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={alGuardar}
      />
    </section>
  );
}
