import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { permisosDespacho } from '../../utils/permisosDespacho';
import { formatearFecha, formatearFechaHora, formatearMoneda } from '../../utils/formatos';

const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', badge: 'bg-secondary' },
  asignado: { etiqueta: 'Asignado', badge: 'bg-primary' },
  en_ruta: { etiqueta: 'En ruta', badge: 'bg-warning' },
  entregado: { etiqueta: 'Entregado', badge: 'bg-success' },
  entrega_parcial: { etiqueta: 'Entrega parcial', badge: 'bg-warning' },
  no_entregado: { etiqueta: 'No entregado', badge: 'bg-danger' },
  cancelado: { etiqueta: 'Cancelado', badge: 'bg-secondary' }
};

const TIPOS_VEHICULO = [
  { value: 'mototaxi', label: 'Mototaxi' },
  { value: 'motocicleta', label: 'Motocicleta' },
  { value: 'carro', label: 'Carro' },
  { value: 'pickup', label: 'Pickup / Camión' }
];

const ETIQUETA_VEHICULO = {
  mototaxi: 'Mototaxi',
  motocicleta: 'Motocicleta',
  carro: 'Carro',
  pickup: 'Pickup / Camión'
};

const METODOS_COBRO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }
];

function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function indicadorPago(d) {
  if (Number(d.factura_contra_entrega) === 1
    && (d.factura_estado_pago === 'pendiente' || d.factura_estado_pago === 'parcial')) {
    return { etiqueta: 'Contra entrega', chip: 'chip-aviso' };
  }
  if (d.factura_condicion === 'credito'
    && (d.factura_estado_pago === 'pendiente' || d.factura_estado_pago === 'parcial')) {
    return { etiqueta: 'Crédito', chip: 'chip-neutro' };
  }
  if (d.factura_condicion === null || d.factura_condicion === undefined) {
    return { etiqueta: 'Sin factura', chip: 'chip-neutro' };
  }
  return { etiqueta: 'Pagado', chip: 'chip-ok' };
}

const FORM_ASIGNAR_VACIO = { responsable_id: '', tipo_vehiculo: '', placa_vehiculo: '' };

const FORM_MANUAL_VACIO = {
  venta_id: '', cliente_id: '', direccion_entrega: '', telefono_contacto: '',
  fecha_programada: hoyLocal(), observaciones: ''
};
const LINEA_MANUAL_VACIA = { producto_id: '', cantidad: '' };

export default function ListadoDespachosPage() {
  const notificar = useNotificacion();
  const permisos = permisosDespacho();
  const [despachos, setDespachos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filtros, setFiltros] = useState({
    q: '', estado: '', fechaInicio: '', fechaFin: '', clienteId: '',
    responsableId: '', tipoVehiculo: '', estadoPago: ''
  });
  const [loading, setLoading] = useState(false);
  const [responsables, setResponsables] = useState([]);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);

  // Modales
  const [modalAsignar, setModalAsignar] = useState(null);
  const [formAsignar, setFormAsignar] = useState(FORM_ASIGNAR_VACIO);
  const [modalEntregar, setModalEntregar] = useState(null);
  const [formEntregar, setFormEntregar] = useState({ recibido_por: '', monto_cobrado: '', metodo_pago: 'efectivo' });
  const [modalMotivo, setModalMotivo] = useState(null); // { despacho, accion }
  const [motivo, setMotivo] = useState('');
  const [modalReprogramar, setModalReprogramar] = useState(null);
  const [fechaReprogramar, setFechaReprogramar] = useState(hoyLocal());
  const [guardando, setGuardando] = useState(false);

  // Creación manual (solo casos especiales sin venta)
  const [modalManual, setModalManual] = useState(false);
  const [formManual, setFormManual] = useState(FORM_MANUAL_VACIO);
  const [lineasManual, setLineasManual] = useState([LINEA_MANUAL_VACIA]);
  const [facturasSugeridas, setFacturasSugeridas] = useState([]);
  const [productosSugeridos, setProductosSugeridos] = useState([]);

  async function cargar() {
    setLoading(true);
    try {
      const params = { ...filtros, page, pageSize };
      const res = await api.get('/despachos', { params });
      setDespachos(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      notificar.error(e.message || 'Error cargando despachos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [filtros, page]);

  useEffect(() => {
    if (!permisos.esGestor) return;
    api.get('/despachos/responsables').then((r) => setResponsables(r.data || [])).catch(() => {});
    api.get('/clientes', { params: { q: '', estado: 'activo', pageSize: 30 } })
      .then((r) => setClientesSugeridos(r.data || [])).catch(() => {});
  }, [permisos.esGestor]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  }

  function abrirAsignar(d) {
    setFormAsignar(FORM_ASIGNAR_VACIO);
    setModalAsignar(d);
  }

  async function confirmarAsignar(evento) {
    evento.preventDefault();
    if (!formAsignar.responsable_id) {
      notificar.error('Selecciona un responsable de entrega');
      return;
    }
    if (!formAsignar.tipo_vehiculo) {
      notificar.error('Selecciona un tipo de vehículo');
      return;
    }
    setGuardando(true);
    try {
      await api.post(`/despachos/${modalAsignar.id}/asignar`, {
        responsable_id: Number(formAsignar.responsable_id),
        tipo_vehiculo: formAsignar.tipo_vehiculo,
        placa_vehiculo: formAsignar.placa_vehiculo.trim() || null
      });
      notificar.exito('Despacho asignado');
      setModalAsignar(null);
      cargar();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirEntregar(d) {
    setFormEntregar({ recibido_por: '', monto_cobrado: '', metodo_pago: 'efectivo' });
    setModalEntregar(d);
  }

  const esContraEntregaPendiente = (d) =>
    d.forma_pago === 'contra_entrega' && Number(d.factura_saldo_pendiente || 0) > 0;

  async function confirmarEntregar(evento) {
    evento.preventDefault();
    const d = modalEntregar;
    if (esContraEntregaPendiente(d)) {
      const monto = Number(formEntregar.monto_cobrado);
      if (!Number.isFinite(monto) || monto <= 0) {
        notificar.error('Registra el monto cobrado en la entrega');
        return;
      }
    }
    setGuardando(true);
    try {
      await api.post(`/despachos/${d.id}/entregar`, {
        recibido_por: formEntregar.recibido_por.trim() || null,
        monto_cobrado: esContraEntregaPendiente(d) ? Number(formEntregar.monto_cobrado) : null,
        metodo_pago: formEntregar.metodo_pago
      });
      notificar.exito('Despacho entregado');
      setModalEntregar(null);
      cargar();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirMotivo(d, accion) {
    setMotivo('');
    setModalMotivo({ despacho: d, accion });
  }

  async function confirmarMotivo(evento) {
    evento.preventDefault();
    if (!motivo.trim()) {
      notificar.error('El motivo es obligatorio');
      return;
    }
    const { despacho, accion } = modalMotivo;
    setGuardando(true);
    try {
      if (accion === 'no_entregado') {
        await api.post(`/despachos/${despacho.id}/no-entregado`, { motivo: motivo.trim() });
        notificar.exito('Despacho marcado como no entregado');
      } else if (accion === 'cancelar') {
        await api.post(`/despachos/${despacho.id}/cancelar`, { motivo: motivo.trim() });
        notificar.exito('Despacho cancelado');
      }
      setModalMotivo(null);
      cargar();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirReprogramar(d) {
    setFechaReprogramar(hoyLocal());
    setModalReprogramar(d);
  }

  async function confirmarReprogramar(evento) {
    evento.preventDefault();
    setGuardando(true);
    try {
      await api.post(`/despachos/${modalReprogramar.id}/reprogramar`, { fecha_programada: fechaReprogramar });
      notificar.exito('Despacho reprogramado');
      setModalReprogramar(null);
      cargar();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(d, nuevoEstado) {
    try {
      await api.post(`/despachos/${d.id}/estado`, { nuevoEstado, comentario: `Cambio de estado desde el listado` });
      notificar.exito(`Estado actualizado a "${ESTADOS[nuevoEstado]?.etiqueta || nuevoEstado}"`);
      cargar();
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function hojaEntrega(d) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}/despacho/${d.id}/hoja-entrega`, '_blank');
  }

  function abrirManual() {
    setFormManual({ ...FORM_MANUAL_VACIO, fecha_programada: hoyLocal() });
    setLineasManual([LINEA_MANUAL_VACIA]);
    setModalManual(true);
    api.get('/facturas', { params: { q: '', pageSize: 30 } }).then((r) => setFacturasSugeridas(r.data || [])).catch(() => {});
    api.get('/productos/autocompletar', { params: { q: '', limite: 30 } }).then((r) => setProductosSugeridos(r.data || [])).catch(() => {});
  }

  async function preseleccionarVenta(ventaId) {
    if (!ventaId) {
      setFormManual((p) => ({ ...p, venta_id: '' }));
      return;
    }
    try {
      const res = await api.get(`/facturas/${ventaId}`);
      const factura = res?.data;
      setFormManual((p) => ({
        ...p,
        venta_id: ventaId,
        cliente_id: factura?.cliente?.id ? String(factura.cliente.id) : p.cliente_id,
        direccion_entrega: p.direccion_entrega || factura?.cliente?.direccion || '',
        telefono_contacto: p.telefono_contacto || factura?.cliente?.telefono || ''
      }));
      if (Array.isArray(factura?.detalles) && factura.detalles.length) {
        setLineasManual(
          factura.detalles
            .filter((d) => d.tipo !== 'servicio')
            .map((d) => ({ producto_id: String(d.producto_id), cantidad: String(d.cantidad) }))
        );
      }
    } catch (e) {
      notificar.error(e.message || 'No se pudo cargar la venta');
    }
  }

  function agregarLineaManual() {
    setLineasManual((prev) => [...prev, { ...LINEA_MANUAL_VACIA }]);
  }

  function eliminarLineaManual(i) {
    if (lineasManual.length <= 1) return;
    setLineasManual((prev) => prev.filter((_, idx) => idx !== i));
  }

  function actualizarLineaManual(i, campo, valor) {
    setLineasManual((prev) => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  }

  async function guardarManual(evento) {
    evento.preventDefault();
    if (!formManual.cliente_id && !formManual.venta_id) {
      notificar.error('Debe indicar cliente o venta');
      return;
    }
    const detalles = lineasManual
      .filter((l) => l.producto_id)
      .map((l) => ({ producto_id: Number(l.producto_id), cantidad: Number(l.cantidad) || 0 }));
    if (!detalles.length) {
      notificar.error('Agregue al menos un producto');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/despachos', {
        ...formManual,
        cliente_id: formManual.cliente_id ? Number(formManual.cliente_id) : null,
        detalles
      });
      notificar.exito('Despacho creado');
      setModalManual(false);
      cargar();
    } catch (err) {
      notificar.error(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pagina despacho-page">
      <div className="pagina-cabecera">
        <div>
          <h1>Listado de Despachos</h1>
          <p>Los despachos con entrega a domicilio se crean automáticamente desde el POS.</p>
        </div>
        {permisos.puedeCrearManual && (
          <button className="btn btn-secundario" onClick={abrirManual}>
            + Nuevo despacho
          </button>
        )}
      </div>

      <div className="tarjeta tarjeta-sombra filtros-productos" style={{ marginBottom: 16 }}>
        <div className="formulario-grid formulario-grid-3">
          <div className="campo">
            <label>Búsqueda</label>
            <input className="control" value={filtros.q} onChange={(e) => actualizarFiltro('q', e.target.value)} placeholder="Código, dirección, cliente..." />
          </div>
          <div className="campo">
            <label>Estado</label>
            <select className="control" value={filtros.estado} onChange={(e) => actualizarFiltro('estado', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS).map(([valor, info]) => <option key={valor} value={valor}>{info.etiqueta}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Estado de pago</label>
            <select className="control" value={filtros.estadoPago} onChange={(e) => actualizarFiltro('estadoPago', e.target.value)}>
              <option value="">Todos</option>
              <option value="pagado">Pagado</option>
              <option value="credito">Crédito</option>
              <option value="por_cobrar">Contra entrega</option>
            </select>
          </div>
          <div className="campo">
            <label>Fecha inicio</label>
            <input type="date" className="control" value={filtros.fechaInicio} onChange={(e) => actualizarFiltro('fechaInicio', e.target.value)} />
          </div>
          <div className="campo">
            <label>Fecha fin</label>
            <input type="date" className="control" value={filtros.fechaFin} onChange={(e) => actualizarFiltro('fechaFin', e.target.value)} />
          </div>
          <div className="campo">
            <label>Cliente</label>
            <select className="control" value={filtros.clienteId} onChange={(e) => actualizarFiltro('clienteId', e.target.value)}>
              <option value="">Todos</option>
              {clientesSugeridos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {permisos.esGestor && (
            <>
              <div className="campo">
                <label>Responsable</label>
                <select className="control" value={filtros.responsableId} onChange={(e) => actualizarFiltro('responsableId', e.target.value)}>
                  <option value="">Todos</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Tipo de vehículo</label>
                <select className="control" value={filtros.tipoVehiculo} onChange={(e) => actualizarFiltro('tipoVehiculo', e.target.value)}>
                  <option value="">Todos</option>
                  {TIPOS_VEHICULO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tarjeta tarjeta-sombra tabla-contenedor" style={{ overflowX: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Fecha prog.</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th>Vehículo</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center text-muted">Cargando...</td></tr>
            ) : despachos.length === 0 ? (
              <tr><td colSpan="9" className="text-center text-muted">No hay despachos</td></tr>
            ) : (
              despachos.map((d) => {
                const pago = indicadorPago(d);
                return (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.codigo}</strong>
                      {Number(d.requiere_revision) === 1 && (
                        <span className="chip chip-peligro despacho-revision" title="Requiere revisión">Revisión</span>
                      )}
                    </td>
                    <td>{d.cliente_nombre || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.direccion_entrega || '—'}</td>
                    <td>{d.fecha_programada ? formatearFecha(d.fecha_programada) : '—'}</td>
                    <td><span className={`badge ${ESTADOS[d.estado]?.badge || 'bg-secondary'}`}>{ESTADOS[d.estado]?.etiqueta || d.estado}</span></td>
                    <td>{d.responsable_nombre || '—'}</td>
                    <td>
                      {d.tipo_vehiculo
                        ? `${ETIQUETA_VEHICULO[d.tipo_vehiculo] || d.tipo_vehiculo}${d.placa_vehiculo ? ` · ${d.placa_vehiculo}` : ''}`
                        : '—'}
                    </td>
                    <td><span className={`chip ${pago.chip}`}>{pago.etiqueta}</span></td>
                    <td>
                      <div className="despacho-acciones">
                        {d.estado === 'pendiente' && permisos.puedeAsignar && (
                          <button className="btn btn-sm btn-primario" onClick={() => abrirAsignar(d)}>Asignar</button>
                        )}
                        {d.estado === 'asignado' && permisos.puedeCambiarEstado && (
                          <button className="btn btn-sm btn-primario" onClick={() => cambiarEstado(d, 'en_ruta')}>Marcar en ruta</button>
                        )}
                        {(d.estado === 'en_ruta' || d.estado === 'entrega_parcial') && permisos.puedeEntregar && (
                          <button className="btn btn-sm btn-primario" onClick={() => abrirEntregar(d)}>Entregar</button>
                        )}
                        {(d.estado === 'en_ruta' || d.estado === 'entrega_parcial') && permisos.puedeCambiarEstado && (
                          <button className="btn btn-sm btn-secundario" onClick={() => abrirMotivo(d, 'no_entregado')}>No entregado</button>
                        )}
                        {d.estado === 'entrega_parcial' && permisos.puedeCambiarEstado && (
                          <button className="btn btn-sm btn-secundario" onClick={() => cambiarEstado(d, 'entregado')}>Completar</button>
                        )}
                        {d.estado === 'no_entregado' && permisos.puedeReprogramar && (
                          <button className="btn btn-sm btn-secundario" onClick={() => abrirReprogramar(d)}>Reprogramar</button>
                        )}
                        {d.estado !== 'entregado' && d.estado !== 'cancelado' && permisos.puedeCancelar && (
                          <button className="btn btn-sm btn-danger" onClick={() => abrirMotivo(d, 'cancelar')}>Cancelar</button>
                        )}
                        <button className="btn btn-sm btn-secundario" onClick={() => hojaEntrega(d)}>Hoja de entrega</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: 'var(--color-texto-suave)' }}>
          Total: {total} | Página {page} de {Math.ceil(total / pageSize) || 1}
        </div>
      </div>

      <Modal abierto={Boolean(modalAsignar)} titulo={`Asignar ${modalAsignar?.codigo || ''}`} onCerrar={() => !guardando && setModalAsignar(null)} ancho="500px">
        <form onSubmit={confirmarAsignar} className="formulario">
          <div className="campo">
            <label>Responsable de entrega *</label>
            <select className="control" value={formAsignar.responsable_id} onChange={(e) => setFormAsignar((p) => ({ ...p, responsable_id: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}{r.es_reparto ? ' (reparto)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Tipo de vehículo *</label>
            <select className="control" value={formAsignar.tipo_vehiculo} onChange={(e) => setFormAsignar((p) => ({ ...p, tipo_vehiculo: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {TIPOS_VEHICULO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Placa o descripción (opcional)</label>
            <input className="control" maxLength={20} value={formAsignar.placa_vehiculo} onChange={(e) => setFormAsignar((p) => ({ ...p, placa_vehiculo: e.target.value }))} />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalAsignar(null)} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando...' : 'Asignar'}</button>
          </div>
        </form>
      </Modal>

      <Modal abierto={Boolean(modalEntregar)} titulo={`Entregar ${modalEntregar?.codigo || ''}`} onCerrar={() => !guardando && setModalEntregar(null)} ancho="500px">
        <form onSubmit={confirmarEntregar} className="formulario">
          <div className="campo">
            <label>Recibido por</label>
            <input className="control" maxLength={100} value={formEntregar.recibido_por} onChange={(e) => setFormEntregar((p) => ({ ...p, recibido_por: e.target.value }))} placeholder="Nombre de quien recibió" />
          </div>
          {modalEntregar && esContraEntregaPendiente(modalEntregar) && (
            <>
              <div className="alerta alerta-info">
                Este despacho es <strong>cobro contra entrega</strong>. Saldo por cobrar:{' '}
                {formatearMoneda(modalEntregar.factura_saldo_pendiente)}.
              </div>
              <div className="campo">
                <label>Monto cobrado *</label>
                <input type="number" className="control" min="0.01" step="0.01" value={formEntregar.monto_cobrado} onChange={(e) => setFormEntregar((p) => ({ ...p, monto_cobrado: e.target.value }))} />
              </div>
              <div className="campo">
                <label>Método de cobro</label>
                <select className="control" value={formEntregar.metodo_pago} onChange={(e) => setFormEntregar((p) => ({ ...p, metodo_pago: e.target.value }))}>
                  {METODOS_COBRO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalEntregar(null)} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando...' : 'Entregar'}</button>
          </div>
        </form>
      </Modal>

      <Modal abierto={Boolean(modalMotivo)} titulo={modalMotivo?.accion === 'cancelar' ? 'Cancelar despacho' : 'Marcar no entregado'} onCerrar={() => !guardando && setModalMotivo(null)} ancho="460px">
        <form onSubmit={confirmarMotivo} className="formulario">
          <div className="campo">
            <label>Motivo *</label>
            <textarea className="control" rows="3" maxLength={255} value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalMotivo(null)} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-danger" disabled={guardando}>{guardando ? 'Guardando...' : 'Confirmar'}</button>
          </div>
        </form>
      </Modal>

      <Modal abierto={Boolean(modalReprogramar)} titulo={`Reprogramar ${modalReprogramar?.codigo || ''}`} onCerrar={() => !guardando && setModalReprogramar(null)} ancho="420px">
        <form onSubmit={confirmarReprogramar} className="formulario">
          <div className="campo">
            <label>Nueva fecha programada *</label>
            <input type="date" className="control" value={fechaReprogramar} onChange={(e) => setFechaReprogramar(e.target.value)} required />
          </div>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalReprogramar(null)} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>Reprogramar</button>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalManual} titulo="Nuevo despacho" onCerrar={() => !guardando && setModalManual(false)} ancho="720px">
        <form onSubmit={guardarManual} className="formulario">
          <p className="ayuda-texto" style={{ margin: '0 0 12px' }}>
            Este formulario es solo para casos especiales <strong>sin venta</strong>. El flujo normal es crear el
            despacho automáticamente desde el POS al activar "Entrega a domicilio".
          </p>

          <div className="formulario-grid formulario-grid-2">
            <div className="campo">
              <label>Venta / Factura (opcional)</label>
              <select className="control" value={formManual.venta_id} onChange={(e) => preseleccionarVenta(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {facturasSugeridas.map((f) => (
                  <option key={f.id} value={f.id}>{f.numero || ('Factura ' + f.id)} — {f.cliente_nombre || ''}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Cliente *</label>
              <select
                className="control"
                value={formManual.cliente_id}
                onChange={(e) => setFormManual((p) => ({ ...p, cliente_id: e.target.value }))}
                required={!formManual.venta_id}
                disabled={Boolean(formManual.venta_id)}
              >
                <option value="">— Seleccionar —</option>
                {clientesSugeridos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Fecha programada *</label>
              <input className="control" type="date" value={formManual.fecha_programada} onChange={(e) => setFormManual((p) => ({ ...p, fecha_programada: e.target.value }))} required />
            </div>
            <div className="campo">
              <label>Teléfono contacto</label>
              <input className="control" value={formManual.telefono_contacto} onChange={(e) => setFormManual((p) => ({ ...p, telefono_contacto: e.target.value }))} />
            </div>
            <div className="campo campo-completo">
              <label>Dirección de entrega</label>
              <input className="control" value={formManual.direccion_entrega} onChange={(e) => setFormManual((p) => ({ ...p, direccion_entrega: e.target.value }))} />
            </div>
            <div className="campo campo-completo">
              <label>Observaciones</label>
              <textarea className="control" rows="2" value={formManual.observaciones} onChange={(e) => setFormManual((p) => ({ ...p, observaciones: e.target.value }))} />
            </div>
          </div>

          <div className="despacho-detalle-titulo">
            <h5>Detalle de productos</h5>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr><th>Producto</th><th style={{ width: 120 }}>Cantidad</th><th style={{ width: 48 }}></th></tr>
              </thead>
              <tbody>
                {lineasManual.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select className="control" style={{ width: '100%' }} value={l.producto_id} onChange={(e) => actualizarLineaManual(i, 'producto_id', e.target.value)}>
                        <option value="">— Producto —</option>
                        {productosSugeridos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` (${p.codigo})` : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="control" style={{ width: '100%' }} type="number" min="1" step="1" value={l.cantidad} onChange={(e) => actualizarLineaManual(i, 'cantidad', e.target.value)} />
                    </td>
                    <td>
                      <button type="button" className="btn-icono-eliminar" onClick={() => eliminarLineaManual(i)} disabled={lineasManual.length === 1} title="Eliminar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-secundario btn-agregar-linea" style={{ alignSelf: 'flex-start' }} onClick={agregarLineaManual}>+ Agregar línea</button>

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalManual(false)} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={guardando}>Guardar despacho</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
