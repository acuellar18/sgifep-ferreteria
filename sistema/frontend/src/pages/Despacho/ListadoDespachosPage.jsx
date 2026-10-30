import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';

function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function ListadoDespachosPage() {
  const notificar = useNotificacion();
  const [despachos, setDespachos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filtros, setFiltros] = useState({ q: '', estado: '', fechaInicio: '', fechaFin: '', clienteId: '' });
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({ venta_id: '', cliente_id: '', direccion_entrega: '', telefono_contacto: '', fecha_programada: hoyLocal(), observaciones: '', detalles: [] });
  const [lineasForm, setLineasForm] = useState([{ producto_id: '', cantidad: '' }]);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [facturasSugeridas, setFacturasSugeridas] = useState([]);
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [error, setError] = useState('');

  async function cargar() {
    setLoading(true);
    try {
      const params = { ...filtros, page, pageSize };
      const res = await api.get('/despachos', { params });
      setDespachos(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      notificar.error('Error cargando despachos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/clientes', { params: { q: '', estado: 'activo', pageSize: 30 } }).then(r => setClientesSugeridos(r.data || [])).catch(() => {});
    api.get('/productos/autocompletar', { params: { q: '', limite: 30 } }).then(r => setProductosSugeridos(r.data || [])).catch(() => {});
    api.get('/facturas', { params: { q: '', pageSize: 30 } }).then(r => setFacturasSugeridas(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { cargar(); }, [filtros, page, pageSize]);

  function actualizarFiltro(campo, valor) {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
  }

  useEffect(() => {
    if (modalAbierto) {
      api.get('/clientes', { params: { q: '', estado: 'activo', pageSize: 30 } }).then(r => setClientesSugeridos(r.data || [])).catch(() => {});
      api.get('/productos/autocompletar', { params: { q: '', limite: 30 } }).then(r => setProductosSugeridos(r.data || [])).catch(() => {});
      api.get('/facturas', { params: { q: '', pageSize: 30 } }).then(r => setFacturasSugeridas(r.data || [])).catch(() => {});
    }
  }, [modalAbierto]);

  function agregarLineaForm() {
    setLineasForm(prev => [...prev, { producto_id: '', cantidad: '' }]);
  }

  function eliminarLineaForm(i) {
    if (lineasForm.length <= 1) return;
    setLineasForm(prev => prev.filter((_, idx) => idx !== i));
  }

  function actualizarLineaForm(i, campo, valor) {
    setLineasForm(prev => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  }

  async function guardar() {
    setError('');
    if (!form.cliente_id && !form.venta_id) { setError('Debe indicar cliente o venta'); return; }
    const detalles = lineasForm.map(l => ({ producto_id: l.producto_id ? Number(l.producto_id) : null, cantidad: Number(l.cantidad) || 0 }));
    try {
      await api.post('/despachos', { ...form, detalles });
      notificar.exito('Despacho creado');
      setModalAbierto(false);
      setForm({ venta_id: '', cliente_id: '', direccion_entrega: '', telefono_contacto: '', fecha_programada: hoyLocal(), observaciones: '', detalles: [] });
      setLineasForm([{ producto_id: '', cantidad: '' }]);
      cargar();
    } catch (e) {
      setError(e.message || 'Error al guardar');
      notificar.error(e.message || 'Error al guardar');
    }
  }

  return (
    <div className="pagina despacho-page">
      <div className="pagina-cabecera">
        <div>
          <h1>Listado de Despachos</h1>
          <p>Gestión de despachos a partir de ventas/facturas</p>
        </div>
        <button className="btn btn-primario" onClick={() => setModalAbierto(true)}>+ Nuevo despacho</button>
      </div>

      <div className="tarjeta tarjeta-sombra filtros-productos" style={{ marginBottom: 16 }}>
        <div className="formulario-grid formulario-grid-3">
          <div className="campo">
            <label>Búsqueda</label>
            <input className="control" value={filtros.q} onChange={e => actualizarFiltro('q', e.target.value)} placeholder="Código, observación..." />
          </div>
          <div className="campo">
            <label>Estado</label>
            <select className="control" value={filtros.estado} onChange={e => actualizarFiltro('estado', e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="programado">Programado</option>
              <option value="en_ruta">En ruta</option>
              <option value="entregado">Entregado</option>
              <option value="entrega_parcial">Entrega parcial</option>
              <option value="fallido">Fallido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="campo">
            <label>Fecha inicio</label>
            <input type="date" className="control" value={filtros.fechaInicio} onChange={e => actualizarFiltro('fechaInicio', e.target.value)} />
          </div>
          <div className="campo">
            <label>Fecha fin</label>
            <input type="date" className="control" value={filtros.fechaFin} onChange={e => actualizarFiltro('fechaFin', e.target.value)} />
          </div>
            <div className="campo">
            <label>Cliente</label>
            <select className="control" value={filtros.clienteId} onChange={e => actualizarFiltro('clienteId', e.target.value)}>
              <option value="">Todos</option>
              {clientesSugeridos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="tarjeta tarjeta-sombra tabla-contenedor" style={{ overflowX: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th><th>Estado</th><th>Fecha prog.</th><th>Cliente</th><th>Observaciones</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {despachos.map(d => (
              <tr key={d.id}>
                <td><strong>{d.codigo}</strong></td>
                <td><span className={`badge bg-${d.estado === 'entregado' ? 'success' : d.estado === 'pendiente' ? 'secondary' : d.estado === 'en_ruta' ? 'primary' : d.estado === 'fallido' ? 'danger' : 'warning'}`}>{d.estado}</span></td>
                <td>{d.fecha_programada ? d.fecha_programada.slice(0, 10) : '—'}</td>
                <td>{d.cliente_nombre || '—'}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.observaciones || '—'}</td>
                <td>
                  <a href={`/usuarios/despacho`} className="btn btn-sm btn-secundario">Ver</a>
                </td>
              </tr>
            ))}
            {despachos.length === 0 && (<tr><td colSpan="6" className="text-center text-muted">No hay despachos</td></tr>)}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
          Total: {total} | Página {page} de {Math.ceil(total / pageSize) || 1}
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal card p-4" style={{ maxWidth: 640, width: '92%', background: '#fff', borderRadius: 12, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Nuevo despacho</h3>
              <button type="button" className="btn-close" onClick={() => setModalAbierto(false)} aria-label="Cerrar" />
            </div>
            {error && <div className="alerta alerta-error mb-2">{error}</div>}
            <form onSubmit={e => { e.preventDefault(); guardar(); }}>
              <div className="formulario-grid formulario-grid-3 mb-2">
                <div className="campo"><label>Venta / Factura (opcional)</label><select className="control" value={form.venta_id} onChange={e => setForm({ ...form, venta_id: e.target.value })}><option value="">— Seleccionar —</option>{facturasSugeridas.map(f => <option key={f.id} value={f.id}>{f.numero || ('Factura '+f.id)}</option>)}</select></div>
                <div className="campo"><label>Cliente *</label><select className="control" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required={!form.venta_id}><option value="">— Seleccionar —</option>{clientesSugeridos.map(c => <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit || '-'})</option>)}</select></div>
                <div className="campo"><label>Fecha programada *</label><input className="control" type="date" value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} required /></div>
                <div className="campo campo-completo"><label>Dirección de entrega</label><input className="control" value={form.direccion_entrega} onChange={e => setForm({ ...form, direccion_entrega: e.target.value })} /></div>
                <div className="campo"><label>Teléfono contacto</label><input className="control" value={form.telefono_contacto} onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} /></div>
                <div className="campo campo-completo"><label>Observaciones</label><textarea className="control" rows="2" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} /></div>
              </div>

              <h5>Detalle de productos</h5>
              <p className="ayuda-texto">Si crea nuevo despacho a partir de venta, los productos ya vienen; si es manual, complete producto y cantidad.</p>
              <table className="tabla" style={{ fontSize: 13 }}>
                <thead><tr><th>Producto ID</th><th>Cantidad</th><th></th></tr></thead>
                <tbody>
                  {lineasForm.map((l, i) => (
                    <tr key={i}>
                      <td><select className="control" style={{ width: '100%' }} value={l.producto_id} onChange={e => actualizarLineaForm(i, 'producto_id', e.target.value)}><option value="">— Producto —</option>{productosSugeridos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo || '-'})</option>)}</select></td>
                      <td><input className="control" style={{ width: '100%' }} type="number" min="1" step="1" value={l.cantidad} onChange={e => actualizarLineaForm(i, 'cantidad', e.target.value)} /></td>
                      <td><button type="button" className="btn-icono-eliminar" onClick={() => eliminarLineaForm(i)} disabled={lineasForm.length === 1} title="Eliminar">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn-secundario btn-agregar-linea mt-2" onClick={agregarLineaForm}>+ Agregar línea</button>

              <div className="d-flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primario">Guardar despacho</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
