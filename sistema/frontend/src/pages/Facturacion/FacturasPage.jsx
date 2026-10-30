import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import FiltrosCompras from '../../components/FiltrosCompras';
import ConfirmDialog from '../../components/ConfirmDialog';
import MenuAcciones from '../../components/MenuAcciones';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
import { permisosFacturacion } from '../../utils/permisosFacturacion';
import { rutaImpresionFacturaVenta } from '../../utils/rutasFacturacion';
import {
  etiquetaEstado,
  etiquetaEstadoPago,
  formatearFecha,
  formatearMoneda
} from '../../utils/formatos';
import FacturaDetalleModal from './FacturaDetalleModal';

const PAGE_SIZE = 10;

const FILTROS_INICIALES = {
  q: '',
  estado: '',
  estado_pago: '',
  startDate: '',
  endDate: ''
};

function IconoFacturado() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}

function IconoCobrado() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c0-1.1-1.34-2-3-2s-3 .9-3 2 1.34 2 3 2 3 .9 3 2-1.34 2-3 2-3-.9-3-2" />
    </svg>
  );
}

function IconoPorCobrar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  );
}

function IconoVencidas() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function ChipEstadoPago({ estado, anulada }) {
  if (anulada) return <span className="chip chip-peligro">Anulada</span>;
  const clase = estado === 'pagada' ? 'chip-ok' : estado === 'parcial' ? 'chip-rol' : 'chip-peligro';
  return <span className={`chip ${clase}`}>{etiquetaEstadoPago(estado)}</span>;
}

export default function FacturasPage() {
  const notificar = useNotificacion();
  const permisos = permisosFacturacion();

  const [facturas, setFacturas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState({ sortBy: 'fecha', sortDir: 'desc' });
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Object.values(filtrosAplicados).some(Boolean);

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = { page: pagina, pageSize: PAGE_SIZE, ...orden };
      for (const [clave, valor] of Object.entries(filtrosAplicados)) {
        if (valor) params[clave] = valor;
      }
      const res = await api.get('/facturas', { params });
      setFacturas(res.data || []);
      const nuevoTotal = Number(res.total ?? (res.data || []).length);
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (pagina > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      setFacturas([]);
      setTotal(0);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [pagina, orden, filtrosAplicados, recarga]);

  const cargarResumen = useCallback(async () => {
    try {
      const res = await api.get('/facturas/resumen');
      setResumen(res.data || null);
    } catch {
      setResumen(null);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen, recarga]);

  function aplicarFiltros(evento) {
    evento.preventDefault();
    setPagina(1);
    setFiltrosAplicados({ ...filtros });
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
    setPagina(1);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  async function verDetalle(factura) {
    try {
      const res = await api.get(`/facturas/${factura.id}`);
      setDetalle(res.data);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function solicitarAnulacion(factura) {
    setConfirmando(factura);
    setMotivo('');
  }

  async function ejecutarAnulacion() {
    if (!confirmando || anulando) return;
    if (!motivo.trim()) {
      notificar.error('Ingrese el motivo de anulación');
      return;
    }
    setAnulando(true);
    try {
      await api.post(`/facturas/${confirmando.id}/anular`, { motivo: motivo.trim() });
      notificar.exito('Factura anulada correctamente');
      setConfirmando(null);
      setDetalle(null);
      setMotivo('');
      setRecarga((valor) => valor + 1);
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setAnulando(false);
    }
  }

  function accionesFactura(factura) {
    const acciones = [
      { etiqueta: 'Ver detalle', onClick: () => verDetalle(factura) },
      {
        etiqueta: 'Imprimir',
        onClick: () => window.open(rutaImpresionFacturaVenta(factura.id), '_blank', 'noopener')
      }
    ];
    if (permisos.anularFacturas && factura.estado === 'emitida') {
      acciones.push({
        etiqueta: 'Anular',
        peligro: true,
        onClick: () => solicitarAnulacion(factura)
      });
    }
    return acciones;
  }

  return (
    <section className="facturacion-facturas">
      <header className="inventario-encabezado">
        <div>
          <h2>Facturas de venta</h2>
          <p className="reporte-detalle">
            Emite facturas, controla el IVA, el inventario y el saldo pendiente de tus clientes.
          </p>
        </div>
        <div className="inventario-acciones-encabezado">
          <span className="inventario-conteo">
            {total} {total === 1 ? 'factura' : 'facturas'}
          </span>
          {permisos.crearFacturas && (
            <Link to="/facturacion/facturas/nueva" className="btn btn-primario">
              + Nueva factura
            </Link>
          )}
        </div>
      </header>

      <div className="inventario-estadisticas">
        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-facturado">
            <IconoFacturado />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearMoneda(resumen.facturado_mes) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Facturado este mes</span>
            <span className="facturacion-stat-detalle">
              {resumen ? `${resumen.facturas_mes} factura(s) emitida(s)` : ' '}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-cobrado">
            <IconoCobrado />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearMoneda(resumen.cobrado_mes) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Cobrado este mes</span>
            <span className="facturacion-stat-detalle">Incluye facturas de contado</span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-saldo">
            <IconoPorCobrar />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearMoneda(resumen.total_por_cobrar) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Saldo por cobrar</span>
            <span className="facturacion-stat-detalle">Facturas al crédito pendientes</span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-vencidas">
            <IconoVencidas />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? resumen.facturas_vencidas : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Facturas vencidas</span>
            <span className="facturacion-stat-detalle">
              {resumen ? `${formatearMoneda(resumen.monto_vencido)} vencidos` : ' '}
            </span>
          </div>
        </div>
      </div>

      <FiltrosCompras
        filtros={filtros}
        onChange={setFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        placeholder="Buscar por número, cliente o NIT..."
      >
        <select
          className="control facturacion-filtro-estado"
          value={filtros.estado}
          onChange={(evento) => setFiltros({ ...filtros, estado: evento.target.value })}
          aria-label="Filtrar por estado"
        >
          <option value="">Estado: todos</option>
          <option value="emitida">Emitidas</option>
          <option value="anulada">Anuladas</option>
        </select>
        <select
          className="control facturacion-filtro-estado"
          value={filtros.estado_pago}
          onChange={(evento) => setFiltros({ ...filtros, estado_pago: evento.target.value })}
          aria-label="Filtrar por estado de pago"
        >
          <option value="">Pago: todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="parcial">Parciales</option>
          <option value="pagada">Pagadas</option>
        </select>
        <input
          type="date"
          className="control facturacion-filtro-fecha"
          value={filtros.startDate}
          onChange={(evento) => setFiltros({ ...filtros, startDate: evento.target.value })}
          aria-label="Fecha desde"
        />
        <input
          type="date"
          className="control facturacion-filtro-fecha"
          value={filtros.endDate}
          onChange={(evento) => setFiltros({ ...filtros, endDate: evento.target.value })}
          aria-label="Fecha hasta"
        />
      </FiltrosCompras>

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
          <p className="estado">Cargando facturas...</p>
        ) : facturas.length === 0 ? (
          <div className="inventario-vacio">
            <p>
              {hayFiltros
                ? 'No se encontraron facturas con los filtros seleccionados.'
                : 'Todavía no hay facturas emitidas.'}
            </p>
            {permisos.crearFacturas && !hayFiltros && (
              <Link to="/facturacion/facturas/nueva" className="btn btn-primario">
                + Nueva factura
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table className="tabla facturacion-tabla-facturas">
                <thead>
                  <tr>
                    <ThOrdenable columna="numero" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Número
                    </ThOrdenable>
                    <ThOrdenable columna="fecha" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Fecha
                    </ThOrdenable>
                    <ThOrdenable columna="cliente_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Cliente
                    </ThOrdenable>
                    <th>Condición</th>
                    <ThOrdenable columna="total" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Total
                    </ThOrdenable>
                    <ThOrdenable columna="saldo_pendiente" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Saldo
                    </ThOrdenable>
                    <ThOrdenable columna="estado_pago" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Pago
                    </ThOrdenable>
                    <ThOrdenable columna="estado" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Estado
                    </ThOrdenable>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((factura) => {
                    const anulada = factura.estado === 'anulada';
                    return (
                      <tr key={factura.id} className={anulada ? 'facturacion-fila-anulada' : undefined}>
                        <td><strong>{factura.numero}</strong></td>
                        <td>{formatearFecha(factura.fecha)}</td>
                        <td>
                          <div className="facturacion-cliente-celda">
                            <strong>{factura.cliente_nombre}</strong>
                            <small>NIT {factura.cliente_nit}</small>
                          </div>
                        </td>
                        <td>{factura.condicion === 'credito' ? 'Crédito' : 'Contado'}</td>
                        <td className="reporte-numero">{formatearMoneda(factura.total)}</td>
                        <td className="reporte-numero">{formatearMoneda(factura.saldo_pendiente)}</td>
                        <td><ChipEstadoPago estado={factura.estado_pago} anulada={anulada} /></td>
                        <td>
                          <span className={`chip ${anulada ? 'chip-peligro' : 'chip-ok'}`}>
                            {etiquetaEstado(factura.estado)}
                          </span>
                        </td>
                        <td className="tabla-acciones">
                          <MenuAcciones
                            acciones={accionesFactura(factura)}
                            etiqueta={`Acciones de la factura ${factura.numero}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
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

      <FacturaDetalleModal
        factura={detalle}
        onCerrar={() => setDetalle(null)}
        onAnular={permisos.anularFacturas
          ? (factura) => {
              setDetalle(null);
              solicitarAnulacion(factura);
            }
          : null}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo="Anular factura"
        mensaje={(
          <div className="facturacion-confirmar-anulacion">
            <p>
              ¿Desea anular la factura <strong>{confirmando?.numero}</strong> de{' '}
              <strong>{confirmando?.cliente_nombre}</strong>? Se devolverá el inventario de los
              productos vendidos.
            </p>
            <label className="campo">
              <span>Motivo de anulación *</span>
              <textarea
                className="control"
                rows={3}
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                placeholder="Explique el motivo de la anulación..."
                autoFocus
              />
            </label>
          </div>
        )}
        confirmarTexto={anulando ? 'Anulando...' : 'Anular factura'}
        onConfirmar={ejecutarAnulacion}
        onCancelar={() => { setConfirmando(null); setMotivo(''); }}
      />
    </section>
  );
}
