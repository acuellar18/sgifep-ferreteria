import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';

function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const FORM_VACIO = {
  venta_id: '',
  cliente_id: '',
  direccion_entrega: '',
  telefono_contacto: '',
  fecha_programada: hoyLocal(),
  observaciones: '',
  detalles: []
};

const LINEA_VACIA = { producto_id: '', cantidad: '' };

const ESTADOS_DESPACHO = [
  ['pendiente', 'Pendiente'],
  ['programado', 'Programado'],
  ['en_ruta', 'En ruta'],
  ['entregado', 'Entregado'],
  ['entrega_parcial', 'Entrega parcial'],
  ['fallido', 'Fallido'],
  ['cancelado', 'Cancelado']
];

function claseBadge(estado) {
  const map = {
    entregado: 'bg-success',
    en_ruta: 'bg-primary',
    fallido: 'bg-danger',
    cancelado: 'bg-warning',
    pendiente: 'bg-secondary',
    programado: 'bg-secondary',
    entrega_parcial: 'bg-warning'
  };
  return map[estado] || 'bg-secondary';
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
  const [form, setForm] = useState(FORM_VACIO);
  const [lineasForm, setLineasForm] = useState([LINEA_VACIA]);
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
      notificar.error(e.message || 'Error cargando despachos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [filtros, page, pageSize]);

  useEffect(() => {
    if (!modalAbierto) return;
    setError('');
    api.get('/clientes', { params: { q: '', estado: 'activo', pageSize: 30 } }).then(r => setClientesSugeridos(r.data || [])).catch(() => {});
    api.get('/productos/autocompletar', { params: { q: '', limite: 30 } }).then(r => setProductosSugeridos(r.data || [])).catch(() => {});
    api.get('/facturas', { params: { q: '', pageSize: 30 } }).then(r => setFacturasSugeridas(r.data || [])).catch(() => {});
  }, [modalAbierto]);

  function actualizarFiltro(campo, valor) {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1);
  }

  function abrirModal() {
    setError('');
    setForm(FORM_VACIO);
    setLineasForm([LINEA_VACIA]);
    setModalAbierto(true);
  }

  async function preseleccionarVenta(ventaId) {
    if (!ventaId) {
      setForm(prev => ({ ...prev, venta_id: '' }));
      return;
    }
    try {
      const res = await api.get(`/facturas/${ventaId}`);
      const factura = res?.data;
      setForm(prev => ({
        ...prev,
        venta_id: ventaId,
        cliente_id: factura?.cliente?.id ? String(factura.cliente.id) : prev.cliente_id,
        direccion_entrega: prev.direccion_entrega || factura?.cliente?.direccion || '',
        telefono_contacto: prev.telefono_contacto || factura?.cliente?.telefono || ''
      }));
      if (Array.isArray(factura?.detalles) && factura.detalles.length) {
        setLineasForm(
          factura.detalles
            .filter(d => d.tipo !== 'servicio')
            .map(d => ({ producto_id: String(d.producto_id), cantidad: String(d.cantidad) }))
        );
      }
    } catch (e) {
      setError(e.message || 'No se pudo cargar la venta');
      notificar.error(e.message || 'No se pudo cargar la venta');
    }
  }

  function agregarLineaForm() {
    setLineasForm(prev => [...prev, { ...LINEA_VACIA }]);
  }

  function eliminarLineaForm(i) {
    if (lineasForm.length <= 1) return;
    setLineasForm(prev => prev.filter((_, idx) => idx !== i));
  }

  function actualizarLineaForm(i, campo, valor) {
    setLineasForm(prev => { const n = [...prev]; n[i] = { ...n[i], [campo]: valor }; return n; });
  }

  async function cambiarEstado(despacho, nuevo) {
    if (!nuevo) return;
    try {
      await api.post(`/despachos/${despacho.id}/estado`, { nuevoEstado: nuevo, comentario: 'Cambio de estado desde el listado' });
      notificar.exito(`Estado actualizado a "${nuevo}"`);
      cargar();
    } catch (e) {
      notificar.error(e.message || 'No se pudo cambiar el estado');
    }
  }

  async function guardar() {
    setError('');
    if (!form.cliente_id && !form.venta_id) { setError('Debe indicar cliente o venta'); return; }
    const detalles = lineasForm
      .filter(l => l.producto_id)
      .map(l => ({ producto_id: Number(l.producto_id), cantidad: Number(l.cantidad) || 0 }));
    try {
      await api.post('/despachos', { ...form, cliente_id: form.cliente_id ? Number(form.cliente_id) : null, detalles });
      notificar.exito('Despacho creado');
      setModalAbierto(false);
      setForm(FORM_VACIO);
      setLineasForm([LINEA_VACIA]);
      setPage(1);
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
        <button className="btn btn-primario" onClick={abrirModal}>+ Nuevo despacho</button>
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
              {ESTADOS_DESPACHO.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
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
                <td><span className={`badge ${claseBadge(d.estado)}`}>{d.estado}</span></td>
                <td>{d.fecha_programada ? d.fecha_programada.slice(0, 10) : '—'}</td>
                <td>{d.cliente_nombre || '—'}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.observaciones || '—'}</td>
                <td>
                  <select
                    className="control"
                    style={{ width: 150, fontSize: 13, padding: '6px 8px' }}
                    value=""
                    onChange={e => cambiarEstado(d, e.target.value)}
                  >
                    <option value="">Cambiar estado</option>
                    {ESTADOS_DESPACHO.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                  </select>
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

      <Modal abierto={modalAbierto} titulo="Nuevo despacho" onCerrar={() => setModalAbierto(false)} ancho="720px">
        <form onSubmit={e => { e.preventDefault(); guardar(); }} className="formulario">
          {error && <div className="alerta alerta-error">{error}</div>}

          <div className="formulario-grid formulario-grid-2">
            <div className="campo">
              <label>Venta / Factura (opcional)</label>
              <select
                className="control"
                value={form.venta_id}
                onChange={e => preseleccionarVenta(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {facturasSugeridas.map(f => (
                  <option key={f.id} value={f.id}>{f.numero || ('Factura ' + f.id)} — {f.cliente_nombre || ''}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label>Cliente *</label>
              <select
                className="control"
                value={form.cliente_id}
                onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                required={!form.venta_id}
                disabled={Boolean(form.venta_id)}
              >
                <option value="">— Seleccionar —</option>
                {clientesSugeridos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Fecha programada *</label>
              <input className="control" type="date" value={form.fecha_programada} onChange={e => setForm({ ...form, fecha_programada: e.target.value })} required />
            </div>
            <div className="campo">
              <label>Teléfono contacto</label>
              <input className="control" value={form.telefono_contacto} onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} />
            </div>
            <div className="campo campo-completo">
              <label>Dirección de entrega</label>
              <input className="control" value={form.direccion_entrega} onChange={e => setForm({ ...form, direccion_entrega: e.target.value })} />
            </div>
            <div className="campo campo-completo">
              <label>Observaciones</label>
              <textarea className="control" rows="2" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
            </div>
          </div>

          <div className="despacho-detalle-titulo">
            <h5>Detalle de productos</h5>
            <p className="ayuda-texto">Si elige una venta los productos se cargan automáticamente; en un despacho manual complete producto y cantidad.</p>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr><th>Producto</th><th style={{ width: 120 }}>Cantidad</th><th style={{ width: 48 }}></th></tr>
              </thead>
              <tbody>
                {lineasForm.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select className="control" style={{ width: '100%' }} value={l.producto_id} onChange={e => actualizarLineaForm(i, 'producto_id', e.target.value)}>
                        <option value="">— Producto —</option>
                        {productosSugeridos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` (${p.codigo})` : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="control" style={{ width: '100%' }} type="number" min="1" step="1" value={l.cantidad} onChange={e => actualizarLineaForm(i, 'cantidad', e.target.value)} />
                    </td>
                    <td>
                      <button type="button" className="btn-icono-eliminar" onClick={() => eliminarLineaForm(i)} disabled={lineasForm.length === 1} title="Eliminar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-secundario btn-agregar-linea" style={{ alignSelf: 'flex-start' }} onClick={agregarLineaForm}>+ Agregar línea</button>

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Guardar despacho</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}