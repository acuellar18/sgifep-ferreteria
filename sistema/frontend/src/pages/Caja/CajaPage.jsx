import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { permisosCaja } from '../../utils/permisosCaja';
import { formatearFechaHora, formatearMoneda } from '../../utils/formatos';

const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];

function etiquetaDenominacion(valor) {
  return `Q${Number(valor).toFixed(2)}`;
}

function IconoCaja() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 14h4" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  );
}

function IconoVentas() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18V9" />
      <path d="M10 18V5" />
      <path d="M16 18v-6" />
      <path d="M22 18H2" />
    </svg>
  );
}

function IconoEfectivo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9v6M18 9v6" />
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

function EstadoCaja({ estado }) {
  return (
    <span className={`chip ${estado === 'abierta' ? 'chip-ok' : 'chip-neutro'}`}>
      {estado === 'abierta' ? 'Abierta' : 'Cerrada'}
    </span>
  );
}

export default function CajaPage() {
  const notificar = useNotificacion();
  const permisos = permisosCaja();
  const [data, setData] = useState({ actual: null, historial: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [montoInicial, setMontoInicial] = useState('100.00');
  const [denominaciones, setDenominaciones] = useState({});
  const [montoContadoTarjeta, setMontoContadoTarjeta] = useState('');
  const [montoContadoTransferencia, setMontoContadoTransferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const actual = data.actual;
  const esperado = Number(actual?.efectivo_esperado || 0);
  const montoContado = DENOMINACIONES.reduce(
    (suma, denominacion) => suma + denominacion * Number(denominaciones[denominacion] || 0),
    0
  );
  const diferencia = montoContado - esperado;
  const totalVentas = Number(actual?.ventas_total || 0);
  const esperadoTarjeta = Number(actual?.ventas_tarjeta || 0)
    + Number(actual?.cobros_tarjeta || 0)
    - Number(actual?.devoluciones_tarjeta || 0);
  const esperadoTransferencia = Number(actual?.ventas_transferencia || 0)
    + Number(actual?.cobros_transferencia || 0)
    - Number(actual?.devoluciones_transferencia || 0);
  const porcentaje = (monto) => (
    totalVentas > 0 ? `${Math.round((Number(monto) / totalVentas) * 100)}%` : '0%'
  );

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/caja');
      setData({ actual: res.data?.actual || null, historial: res.data?.historial || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirModalApertura() {
    setMontoInicial('100.00');
    setModalApertura(true);
  }

  function abrirModalCierre() {
    setDenominaciones({});
    setMontoContadoTarjeta(esperadoTarjeta.toFixed(2));
    setMontoContadoTransferencia(esperadoTransferencia.toFixed(2));
    setObservaciones('');
    setModalCierre(true);
  }

  function cambiarDenominacion(denominacion, valor) {
    setDenominaciones((prev) => ({ ...prev, [denominacion]: valor }));
  }

  async function abrirCaja(evento) {
    evento.preventDefault();
    setGuardando(true);
    try {
      const res = await api.post('/caja/abrir', { monto_inicial: Number(montoInicial) });
      setData({ actual: res.data?.actual || null, historial: res.data?.historial || [] });
      setModalApertura(false);
      notificar.exito('Caja abierta correctamente');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cerrarCaja(evento) {
    evento.preventDefault();
    setGuardando(true);
    try {
      const res = await api.post('/caja/cerrar', {
        denominaciones,
        monto_contado_tarjeta: Number(montoContadoTarjeta || 0),
        monto_contado_transferencia: Number(montoContadoTransferencia || 0),
        observaciones
      });
      setData({ actual: res.data?.actual || null, historial: res.data?.historial || [] });
      setModalCierre(false);
      notificar.exito('Caja cerrada correctamente');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="caja">
        <div className="caja-cargando">Cargando caja...</div>
      </section>
    );
  }

  return (
    <section className="caja">
      <header className="caja-encabezado">
        <div>
          <h2>Caja</h2>
          <p>Apertura, cierre y arqueo del turno</p>
        </div>
        <span className={`chip ${actual ? 'chip-ok' : 'chip-neutro'}`}>
          {actual ? 'Caja abierta' : 'Caja cerrada'}
        </span>
      </header>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="caja-estadisticas">
        <article className="caja-estadistica">
          <span className="caja-estadistica-icono"><IconoCaja /></span>
          <div>
            <strong>{formatearMoneda(actual?.monto_inicial || 0)}</strong>
            <span>Monto inicial</span>
          </div>
        </article>

        <article className="caja-estadistica">
          <span className="caja-estadistica-icono caja-icono-ventas"><IconoVentas /></span>
          <div>
            <strong>{formatearMoneda(actual?.ventas_total || 0)}</strong>
            <span>
              Ventas del turno
              {actual ? ` (${actual.ventas_count})` : ''}
            </span>
          </div>
        </article>

        <article className="caja-estadistica">
          <span className="caja-estadistica-icono caja-icono-efectivo"><IconoEfectivo /></span>
          <div>
            <strong>{formatearMoneda(actual?.efectivo_esperado || 0)}</strong>
            <span>Efectivo esperado</span>
          </div>
        </article>

        <article className="caja-estadistica">
          <span className="caja-estadistica-icono caja-icono-reloj"><IconoReloj /></span>
          <div>
            <strong className="caja-fecha-valor">
              {actual?.fecha_apertura ? formatearFechaHora(actual.fecha_apertura) : 'Sin apertura'}
            </strong>
            <span>Apertura</span>
          </div>
        </article>
      </div>

      {actual ? (
        <div className="caja-panel">
          <header className="caja-panel-cabecera">
            <div>
              <h3>Resumen del turno</h3>
              <p>Abierta el {formatearFechaHora(actual.fecha_apertura)}</p>
            </div>
            {permisos.cerrarCaja && (
              <button type="button" className="btn btn-danger" onClick={abrirModalCierre}>
                Cerrar caja
              </button>
            )}
          </header>

          <div className="caja-resumen">
            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-efectivo" />
              <div>
                <span>Efectivo</span>
                <strong>{formatearMoneda(actual.ventas_efectivo)}</strong>
              </div>
              <small>{porcentaje(actual.ventas_efectivo)}</small>
            </div>

            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-tarjeta" />
              <div>
                <span>Tarjeta</span>
                <strong>{formatearMoneda(actual.ventas_tarjeta)}</strong>
              </div>
              <small>{porcentaje(actual.ventas_tarjeta)}</small>
            </div>

            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-transferencia" />
              <div>
                <span>Transferencia</span>
                <strong>{formatearMoneda(actual.ventas_transferencia)}</strong>
              </div>
              <small>{porcentaje(actual.ventas_transferencia)}</small>
            </div>

            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-total" />
              <div>
                <span>Total vendido</span>
                <strong>{formatearMoneda(actual.ventas_total)}</strong>
              </div>
              <small>{totalVentas > 0 ? '100%' : '0%'}</small>
            </div>

            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-efectivo" />
              <div>
                <span>Cobros de crédito</span>
                <strong>{formatearMoneda(actual.cobros_total || 0)}</strong>
              </div>
              <small>{actual.cobros_count || 0} cobros</small>
            </div>

            <div className="caja-resumen-item">
              <span className="caja-barra caja-barra-tarjeta" />
              <div>
                <span>Devoluciones</span>
                <strong>{formatearMoneda(actual.devoluciones_total || 0)}</strong>
              </div>
              <small>{actual.devoluciones_count || 0} devoluciones</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="caja-panel caja-sin-turno">
          <span className="caja-sin-turno-icono"><IconoCaja /></span>
          <div>
            <h3>No hay una caja abierta</h3>
            <p>Registra el monto inicial para comenzar el turno y controlar las ventas en efectivo.</p>
          </div>
          {permisos.abrirCaja && (
            <button type="button" className="btn btn-primario" onClick={abrirModalApertura}>
              Abrir caja
            </button>
          )}
        </div>
      )}

      <div className="caja-panel">
        <header className="caja-panel-cabecera">
          <div>
            <h3>Historial de cajas</h3>
            <p>Sesiones de caja registradas por tu usuario</p>
          </div>
        </header>

        <div className="tabla-wrapper caja-tabla-wrapper">
          <table className="tabla caja-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Inicial</th>
                <th>Ventas</th>
                <th>Efectivo</th>
                <th>Contado</th>
                <th>Diferencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.historial.length === 0 ? (
                <tr>
                  <td colSpan="9" className="caja-tabla-vacia">
                    Todavía no hay sesiones de caja registradas.
                  </td>
                </tr>
              ) : (
                data.historial.map((sesion) => (
                  <tr key={sesion.id}>
                    <td>{sesion.id}</td>
                    <td>{formatearFechaHora(sesion.fecha_apertura)}</td>
                    <td>{sesion.fecha_cierre ? formatearFechaHora(sesion.fecha_cierre) : '—'}</td>
                    <td>{formatearMoneda(sesion.monto_inicial)}</td>
                    <td>{formatearMoneda(sesion.ventas_total)}</td>
                    <td>{formatearMoneda(sesion.efectivo_esperado)}</td>
                    <td>{sesion.monto_contado === null ? '—' : formatearMoneda(sesion.monto_contado)}</td>
                    <td className={sesion.diferencia > 0 ? 'caja-diferencia-positiva' : sesion.diferencia < 0 ? 'caja-diferencia-negativa' : ''}>
                      {sesion.diferencia === null ? '—' : formatearMoneda(sesion.diferencia)}
                    </td>
                    <td><EstadoCaja estado={sesion.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        abierto={modalApertura}
        titulo="Abrir caja"
        onCerrar={() => !guardando && setModalApertura(false)}
        ancho="440px"
      >
        <form onSubmit={abrirCaja} className="caja-form">
          <p className="caja-form-descripcion">
            Ingresa el efectivo con el que inicia el turno. Este monto se sumará a las ventas de contado.
          </p>
          <label className="campo">
            <span>Monto inicial en efectivo</span>
            <input
              type="number"
              className="control"
              min="0"
              step="0.01"
              required
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
            />
          </label>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalApertura(false)} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={modalCierre}
        titulo="Cerrar caja"
        onCerrar={() => !guardando && setModalCierre(false)}
        ancho="500px"
      >
        <form onSubmit={cerrarCaja} className="caja-form">
          <div className="caja-cierre-resumen">
            <div>
              <span>Efectivo esperado</span>
              <strong>{formatearMoneda(esperado)}</strong>
            </div>
            <div>
              <span>Efectivo contado</span>
              <strong>{formatearMoneda(montoContado)}</strong>
            </div>
            <div>
              <span>Diferencia</span>
              <strong className={diferencia > 0 ? 'caja-diferencia-positiva' : diferencia < 0 ? 'caja-diferencia-negativa' : ''}>
                {formatearMoneda(diferencia)}
              </strong>
            </div>
          </div>

          <div className="caja-denominaciones">
            <div className="caja-denominaciones-cabecera">
              <strong>Arqueo de efectivo</strong>
              <span>Ingresa la cantidad de billetes y monedas</span>
            </div>
            <div className="caja-denominaciones-grid">
              {DENOMINACIONES.map((denominacion) => (
                <label key={denominacion} className="caja-denominacion">
                  <span>{etiquetaDenominacion(denominacion)}</span>
                  <input
                    type="number"
                    className="control"
                    min="0"
                    step="1"
                    value={denominaciones[denominacion] || ''}
                    onChange={(e) => cambiarDenominacion(denominacion, e.target.value)}
                  />
                  <small>
                    {formatearMoneda(denominacion * Number(denominaciones[denominacion] || 0))}
                  </small>
                </label>
              ))}
            </div>
          </div>

          <div className="caja-cierre-metodos">
            <label className="campo">
              <span>Tarjeta contada</span>
              <input
                type="number"
                className="control"
                min="0"
                step="0.01"
                value={montoContadoTarjeta}
                onChange={(e) => setMontoContadoTarjeta(e.target.value)}
              />
              <small>Esperado: {formatearMoneda(esperadoTarjeta)}</small>
            </label>
            <label className="campo">
              <span>Transferencia contada</span>
              <input
                type="number"
                className="control"
                min="0"
                step="0.01"
                value={montoContadoTransferencia}
                onChange={(e) => setMontoContadoTransferencia(e.target.value)}
              />
              <small>Esperado: {formatearMoneda(esperadoTransferencia)}</small>
            </label>
          </div>

          <label className="campo">
            <span>Observaciones</span>
            <textarea
              className="control"
              rows="3"
              maxLength={500}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Novedades del turno, faltantes o sobrantes..."
            />
          </label>

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalCierre(false)} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger" disabled={guardando}>
              {guardando ? 'Cerrando...' : 'Cerrar caja'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
