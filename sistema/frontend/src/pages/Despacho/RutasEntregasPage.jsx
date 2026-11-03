import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';

const FORM_VACIO = {
  fecha: '',
  conductor_id: '',
  vehiculo_id: '',
  zona: '',
  paradas: [{ despacho_id: '', orden: 1 }]
};

function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function claseBadge(estado) {
  const map = {
    en_curso: 'bg-primary',
    finalizada: 'bg-success',
    cancelada: 'bg-danger',
    planificada: 'bg-secondary'
  };
  return map[estado] || 'bg-secondary';
}

export default function RutasEntregasPage() {
  const notificar = useNotificacion();
  const [rutas, setRutas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [despachosDisponibles, setDespachosDisponibles] = useState([]);
  const [error, setError] = useState('');

  async function cargar() {
    setLoading(true);
    try {
      const res = await api.get('/rutas', { params: { page, pageSize: 10 } });
      setRutas(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      notificar.error(e.message || 'Error cargando rutas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/rutas/conductores').then(r => setConductores(r.data || [])).catch(() => {});
    api.get('/rutas/vehiculos').then(r => setVehiculos(r.data || [])).catch(() => {});
  }, []);

  function abrirModal() {
    setError('');
    setForm({ ...FORM_VACIO, fecha: hoyLocal(), paradas: [{ despacho_id: '', orden: 1 }] });
    setModal(true);
  }

  useEffect(() => {
    if (!modal) return;
    api.get('/despachos/disponibles').then(r => setDespachosDisponibles(r.data || [])).catch(() => {});
  }, [modal]);

  function agregarParada() {
    setForm(prev => ({ ...prev, paradas: [...prev.paradas, { despacho_id: '', orden: prev.paradas.length + 1 }] }));
  }

  function actualizarParada(i, despachoId) {
    setForm(prev => {
      const n = [...prev.paradas];
      n[i] = { ...n[i], despacho_id: despachoId };
      return { ...prev, paradas: n };
    });
  }

  function eliminarParada(i) {
    setForm(prev => ({ ...prev, paradas: prev.paradas.filter((_, idx) => idx !== i) }));
  }

  const hayDuplicado = form.paradas.some((p, i) =>
    p.despacho_id && form.paradas.some((o, j) =>
      j !== i && o.despacho_id && String(o.despacho_id) === String(p.despacho_id)
    )
  );

  async function guardar() {
    setError('');
    const paradas = form.paradas.filter(p => p.despacho_id);
    if (!paradas.length) { setError('Debe agregar al menos una parada'); return; }
    const ids = paradas.map(p => String(p.despacho_id));
    if (new Set(ids).size !== ids.length) { setError('No puede repetir el mismo despacho en la ruta'); return; }
    try {
      await api.post('/rutas', { ...form, paradas });
      notificar.exito('Ruta creada');
      setModal(false);
      setForm(FORM_VACIO);
      cargar();
    } catch (e) {
      setError(e.message || 'Error');
      notificar.error(e.message || 'Error');
    }
  }

  async function iniciar(id) {
    try {
      await api.post(`/rutas/${id}/iniciar`);
      notificar.exito('Ruta iniciada');
      cargar();
    } catch (e) {
      notificar.error(e.message || 'Error');
    }
  }

  async function cancelar(id) {
    const m = prompt('Motivo de cancelación:');
    if (!m) return;
    try {
      await api.post(`/rutas/${id}/cancelar`, { motivo: m });
      notificar.exito('Cancelada');
      cargar();
    } catch (e) {
      notificar.error(e.message || 'Error');
    }
  }

  return (
    <div className="pagina ruta-page">
      <div className="pagina-cabecera">
        <div><h1>Rutas y Entregas</h1><p>Planificar rutas, registrar entregas por parada y finalizar</p></div>
        <button className="btn btn-primario" onClick={abrirModal}>+ Nueva ruta</button>
      </div>

      <div className="tarjeta tarjeta-sombra tabla-contenedor">
        {loading && <p style={{ padding: 16 }}>Cargando...</p>}
        <table className="tabla">
          <thead><tr><th>Código</th><th>Fecha</th><th>Conductor</th><th>Vehículo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rutas.map(r => (
              <tr key={r.id}>
                <td><strong>{r.codigo}</strong></td>
                <td>{r.fecha ? r.fecha.slice(0, 10) : '—'}</td>
                <td>{r.conductor_nombre || '—'}</td>
                <td>{r.vehiculo_placa || '—'}</td>
                <td><span className={`badge ${claseBadge(r.estado)}`}>{r.estado}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-secundario" onClick={() => iniciar(r.id)} disabled={r.estado !== 'planificada'}>Iniciar</button>
                    <button className="btn btn-sm btn-secundario" onClick={() => cancelar(r.id)} disabled={r.estado === 'cancelada' || r.estado === 'finalizada'}>Cancelar</button>
                  </div>
                </td>
              </tr>
            ))}
            {rutas.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No hay rutas</td></tr>}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', fontSize: 13, color: '#6b7280', padding: '10px 16px' }}>Total: {total}</div>
      </div>

      <Modal abierto={modal} titulo="Nueva ruta" onCerrar={() => setModal(false)} ancho="720px">
        <form onSubmit={e => { e.preventDefault(); guardar(); }} className="formulario">
          {error && <div className="alerta alerta-error">{error}</div>}

          <div className="formulario-grid formulario-grid-2">
            <div className="campo">
              <label>Fecha *</label>
              <input className="control" type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div className="campo">
              <label>Conductor *</label>
              <select className="control" value={form.conductor_id} onChange={e => setForm({ ...form, conductor_id: e.target.value })} required>
                <option value="">— Seleccionar —</option>
                {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Vehículo *</label>
              <select className="control" value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })} required>
                <option value="">— Seleccionar —</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}{v.descripcion ? ` — ${v.descripcion}` : ''}</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Zona / Nombre</label>
              <input className="control" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })} />
            </div>
          </div>

          <div className="despacho-detalle-titulo">
            <h5>Paradas (despachos pendientes o programados)</h5>
            <p className="ayuda-texto">Solo se listan despachos que no estén ya en otra ruta activa.</p>
          </div>

          {form.paradas.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="control"
                style={{ flex: 1 }}
                value={p.despacho_id}
                onChange={e => actualizarParada(i, e.target.value)}
              >
                <option value="">— Despacho —</option>
                {despachosDisponibles
                  .filter(d => form.paradas.every((o, idx) => idx === i || String(o.despacho_id) !== String(d.id)))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.codigo} — {d.cliente_nombre || 'Sin cliente'}{d.fecha_programada ? ` (${d.fecha_programada.slice(0, 10)})` : ''}
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: 12, color: '#6b7280', minWidth: 40 }}>#{p.orden}</span>
              <button type="button" className="btn-icono-eliminar" onClick={() => eliminarParada(i)} disabled={form.paradas.length === 1} title="Quitar">✕</button>
            </div>
          ))}
          {form.paradas.some(p => !p.despacho_id) && form.paradas.length > 0 && (
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>Complete o quite las paradas vacías.</p>
          )}
          {hayDuplicado && (
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>No puede repetir el mismo despacho en la ruta.</p>
          )}
          <button type="button" className="btn btn-secundario btn-agregar-linea" style={{ alignSelf: 'flex-start' }} onClick={agregarParada}>+ Parada</button>

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Guardar ruta</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}