import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';

export default function RutasEntregasPage() {
  const notificar = useNotificacion();
  const [rutas, setRutas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fecha: '', conductor_id: '', vehiculo_id: '', zona: '', paradas: [{ despacho_id: '', orden: 1 }] });
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [error, setError] = useState('');

  async function cargar() {
    setLoading(true);
    try {
      const res = await api.get('/rutas', { params: { page, pageSize: 10 } });
      setRutas(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { notificar.error('Error cargando rutas'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    api.get('/rutas/conductores').then(r => setConductores(r.data || [])).catch(() => {});
    api.get('/rutas/vehiculos').then(r => setVehiculos(r.data || [])).catch(() => {});
  }, []);

  function agregarParada() {
    setForm(prev => ({ ...prev, paradas: [...prev.paradas, { despacho_id: '', orden: prev.paradas.length + 1 }] }));
  }

  async function guardar() {
    setError('');
    try {
      await api.post('/rutas', form);
      notificar.exito('Ruta creada');
      setModal(false);
      setForm({ fecha: '', conductor_id: '', vehiculo_id: '', zona: '', paradas: [{ despacho_id: '', orden: 1 }] });
      cargar();
    } catch (e) { setError(e.message || 'Error'); notificar.error(e.message || 'Error'); }
  }

  async function iniciar(id) {
    try { await api.post(`/rutas/${id}/iniciar`); notificar.exito('Ruta iniciada'); cargar(); } catch (e) { notificar.error(e.message || 'Error'); }
  }

  async function cancelar(id, motivo) {
    const m = prompt('Motivo de cancelación:');
    if (!m) return;
    try { await api.post(`/rutas/${id}/cancelar`, { motivo: m }); notificar.exito('Cancelada'); cargar(); } catch (e) { notificar.error(e.message || 'Error'); }
  }

  return (
    <div className="pagina ruta-page">
      <div className="pagina-cabecera">
        <div><h1>Rutas y Entregas</h1><p>Planificar rutas, registrar entregas por parada y finaliza</p></div>
        <button className="btn btn-primario" onClick={() => setModal(true)}>+ Nueva ruta</button>
      </div>

      <div className="tarjeta tarjeta-sombra" style={{ padding: 16 }}>
        {loading && <p>Cargando...</p>}
        <table className="tabla">
          <thead><tr><th>Código</th><th>Fecha</th><th>Conductor</th><th>Vehículo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rutas.map(r => (
              <tr key={r.id}>
                <td><strong>{r.codigo}</strong></td>
                <td>{r.fecha ? r.fecha.slice(0, 10) : '—'}</td>
                <td>{r.conductor_nombre || '—'}</td>
                <td>{r.vehiculo_placa || '—'}</td>
                <td><span className={`badge bg-${r.estado === 'en_curso' ? 'primary' : r.estado === 'finalizada' ? 'success' : r.estado === 'cancelada' ? 'danger' : 'secondary'}`}>{r.estado}</span></td>
                <td>
                  <button className="btn btn-sm btn-secundario" onClick={() => iniciar(r.id)} disabled={r.estado !== 'planificada'}>Iniciar</button>{' '}
                  <button className="btn btn-sm btn-secundario" onClick={() => cancelar(r.id)}>Cancelar</button>
                </td>
              </tr>
            ))}
            {rutas.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No hay rutas</td></tr>}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280', padding: '10px 0' }}>Total: {total}</div>
      </div>

      {modal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal card p-4" style={{ maxWidth: 640, width: '92%', background: '#fff', borderRadius: 12 }}>
            <div className="d-flex justify-content-between align-items-center mb-3"><h3>Nueva ruta</h3><button className="btn-close" onClick={() => setModal(false)} /></div>
            {error && <div className="alerta alerta-error mb-2">{error}</div>}
            <form onSubmit={e => { e.preventDefault(); guardar(); }}>
              <div className="formulario-grid formulario-grid-3">
                <div className="campo"><label>Fecha *</label><input className="control" type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
                <div className="campo"><label>Conductor *</label><select className="control" value={form.conductor_id} onChange={e => setForm({ ...form, conductor_id: e.target.value })} required><option value="">— Seleccionar —</option>{conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                <div className="campo"><label>Vehículo *</label><select className="control" value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })} required><option value="">— Seleccionar —</option>{vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.descripcion || ''}</option>)}</select></div>
                <div className="campo campo-completo"><label>Zona / Nombre</label><input className="control" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} /></div>
              </div>
              <h5 className="mt-2">Paradas (despachos programados)</h5>
              {form.paradas.map((p, i) => (
                <div key={i} className="d-flex gap-2 mb-1">
                  <input className="control" type="number" placeholder="ID despacho" value={p.despacho_id} onChange={e => { const n = [...form.paradas]; n[i] = { ...n[i], despacho_id: e.target.value }; setForm({ ...form, paradas: n }); }} />
                  <button type="button" className="btn btn-icono-eliminar" onClick={() => setForm({ ...form, paradas: form.paradas.filter((_, idx) => idx !== i) })} disabled={form.paradas.length === 1}>✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-secundario btn-agregar-linea" onClick={() => setForm({ ...form, paradas: [...form.paradas, { despacho_id: '', orden: form.paradas.length + 1 }] })}>+ Parada</button>
              <div className="d-flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secundario" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primario">Guardar ruta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
