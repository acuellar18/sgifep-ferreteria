import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

export default function RecibirMercaderiaModal({ abierto, orden, proveedores, onCerrar, onRecibido }) {
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [condicion, setCondicion] = useState('credito');
  const [numero_factura, setNumeroFactura] = useState('');
  const [fecha_vencimiento, setFechaVencimiento] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!abierto || !orden) return;
    setError('');
    setLineas(
      (orden.detalles || []).map(d => ({
        producto_id: d.producto_id,
        producto_codigo: d.codigo,
        producto_nombre: d.nombre,
        unidad_medida: d.unidad_medida,
        cantidad_solicitada: Number(d.cantidad_solicitada),
        cantidad_recibida: Number(d.cantidad_recibida),
        pendiente: Math.max(0, Number(d.cantidad_solicitada) - Number(d.cantidad_recibida)),
        costo_estimado: Number(d.costo_estimado),
        costo_unitario: Number(d.costo_estimado)
      }))
    );
    if (orden.proveedor_id) {
      const prov = proveedores.find(p => p.id === orden.proveedor_id);
      if (prov && prov.dias_credito > 0) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + prov.dias_credito);
        setFechaVencimiento(fecha.toISOString().split('T')[0]);
        setCondicion('credito');
      }
    }
  }, [abierto, orden, proveedores]);

  function actualizarRecibida(index, valor) {
    const num = Math.max(0, Number(valor) || 0);
    setLineas(prev => {
      const nuevas = [...prev];
      const pendiente = Math.max(0, nuevas[index].cantidad_solicitada - num);
      nuevas[index] = { ...nuevas[index], cantidad_recibida: num, pendiente };
      return nuevas;
    });
  }

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(valor);
  }

  function totalRecibir() {
    return lineas.reduce((s, l) => s + (Number(l.cantidad_recibida) * Number(l.costo_unitario)), 0);
  }

  async function recibir(e) {
    e.preventDefault();
    setError('');
    const lineasConCantidad = lineas.filter(l => Number(l.cantidad_recibida) > 0);
    if (lineasConCantidad.length === 0) { setError('Debe indicar al menos un producto con cantidad recibida > 0'); return; }
    if (condicion === 'credito' && !fecha_vencimiento) { setError('En compras a crédito, la fecha de vencimiento es requerida'); return; }

    const detalles = lineasConCantidad.map(l => ({
      producto_id: l.producto_id,
      cantidad: Number(l.cantidad_recibida),
      costo_unitario: Number(l.costo_unitario)
    }));

    const payload = {
      proveedor_id: orden.proveedor_id,
      fecha: new Date().toISOString().split('T')[0],
      numero_factura: numero_factura.trim().toUpperCase() || null,
      condicion,
      fecha_vencimiento: condicion === 'credito' ? fecha_vencimiento : null,
      orden_compra_id: orden.id,
      notas: notas.trim() || `Recepción de orden ${orden.numero}`,
      detalles
    };

    setGuardando(true);
    try {
      const res = await api.post('/ordenes-compra/' + orden.id + '/recibir', payload);
      onRecibido('Mercadería recibida y compra registrada correctamente', res.data.compraId);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={`Recibir mercadería: ${orden?.numero || ''}`} onCerrar={onCerrar} ancho="900px">
      <form onSubmit={recibir} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-grid" style={{ gap: '12px', marginBottom: '16px' }}>
          <label className="campo">
            <span>N° Factura proveedor</span>
            <input type="text" className="control" value={numero_factura} onChange={(e) => setNumeroFactura(e.target.value.toUpperCase())} placeholder="FAC-00123" />
          </label>
          <label className="campo">
            <span>Condición *</span>
            <select className="control" value={condicion} onChange={(e) => setCondicion(e.target.value)}>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </label>
          {condicion === 'credito' && (
            <label className="campo">
              <span>Fecha vencimiento *</span>
              <input type="date" className="control" required value={fecha_vencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
            </label>
          )}
        </div>

        <h4 style={{ margin: '16px 0 8px' }}>Productos a recibir</h4>
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{width:'35%'}}>Producto</th>
                <th style={{width:'12%',textAlign:'center'}}>Solicitado</th>
                <th style={{width:'12%',textAlign:'center'}}>Ya recibido</th>
                <th style={{width:'12%',textAlign:'center'}}>Pendiente</th>
                <th style={{width:'12%',textAlign:'center'}}>Recibir ahora</th>
                <th style={{width:'12%',textAlign:'right'}}>Costo unit.</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td>
                    <strong>{l.producto_nombre}</strong>
                    <br /><small style={{color:'#6b7280'}}>Código: {l.producto_codigo}</small>
                  </td>
                  <td style={{textAlign:'center'}}>{l.cantidad_solicitada.toLocaleString('es-GT', {minimumFractionDigits: 2})} {l.unidad_medida}</td>
                  <td style={{textAlign:'center'}}>{l.cantidad_recibida.toLocaleString('es-GT', {minimumFractionDigits: 2})} {l.unidad_medida}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{color: l.pendiente > 0 ? '#dc2626' : '#16a34a', fontWeight: 600}}>
                      {l.pendiente.toLocaleString('es-GT', {minimumFractionDigits: 2})} {l.unidad_medida}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <input
                      type="number" className="control" step="0.001" min="0" max={l.pendiente}
                      value={l.cantidad_recibida - l.cantidad_recibida + (l.cantidad_recibida || 0)}
                      onChange={(e) => actualizarRecibida(i, e.target.value)}
                      style={{ width: '100px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{textAlign:'right'}}>
                    <input
                      type="number" className="control" step="0.01" min="0"
                      value={l.costo_unitario}
                      onChange={(e) => setLineas(prev => { const n = [...prev]; n[i] = {...n[i], costo_unitario: Number(e.target.value) || 0}; return n; })}
                      style={{ width: '120px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-grid" style={{ marginTop: '16px', gap: '12px' }}>
          <div className="campo"><span>Total a recibir</span> <strong style={{fontSize:'18px',color:'#16a34a'}}>{formatearMoneda(totalRecibir())}</strong></div>
          <label className="campo" style={{ gridColumn: '1 / -1' }}>
            <span>Notas</span>
            <textarea className="control" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones de la recepción..." />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secundario" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={guardando || lineas.filter(l => Number(l.cantidad_recibida) > 0).length === 0}>
            {guardando ? 'Procesando...' : 'Registrar recepción'}
          </button>
        </div>
      </form>
    </Modal>
  );
}