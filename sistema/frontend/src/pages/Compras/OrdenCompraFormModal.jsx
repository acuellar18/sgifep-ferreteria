import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ProductoAutocompletar from './ProductoAutocompletar';

const FORM_INICIAL = {
  proveedor_id: '',
  fecha: new Date().toISOString().split('T')[0],
  fecha_esperada: '',
  estado: 'borrador',
  notas: ''
};

const LINEA_INICIAL = {
  producto_id: '',
  producto_codigo: '',
  producto_nombre: '',
  unidad_medida: '',
  cantidad: '',
  costo_estimado: ''
};

export default function OrdenCompraFormModal({ abierto, orden, proveedores, onCerrar, onGuardado }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [lineas, setLineas] = useState([LINEA_INICIAL]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [totales, setTotales] = useState({ subtotal: 0, iva: 0, total: 0 });
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const inputProductoRefs = useRef([]);

  const esAlta = !orden;

  useEffect(() => {
    if (!abierto) return;
    setError('');
    if (orden) {
      setForm({
        proveedor_id: orden.proveedor_id || '',
        fecha: orden.fecha || '',
        fecha_esperada: orden.fecha_esperada || '',
        estado: orden.estado || 'borrador',
        notas: orden.notas || ''
      });
      setLineas((orden.detalles || []).map(d => ({
        producto_id: d.producto_id,
        producto_codigo: d.codigo,
        producto_nombre: d.nombre,
        unidad_medida: d.unidad_medida,
        cantidad: d.cantidad_solicitada,
        costo_estimado: d.costo_estimado
      })));
    } else {
      setForm(FORM_INICIAL);
      setLineas([LINEA_INICIAL]);
    }
  }, [abierto, orden]);

  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  function actualizarLinea(index, campo, valor) {
    setLineas(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return nuevas;
    });
  }

  async function buscarProductos(q) {
    if (!q || q.length < 2) { setProductosSugeridos([]); return; }
    try {
      const res = await api.get('/productos/autocompletar', { params: { q, limite: 10 } });
      setProductosSugeridos(res.data);
    } catch (err) { console.error(err); }
  }

  function seleccionarProducto(index, prod) {
    setLineas(prev => {
      const nuevas = [...prev];
      nuevas[index] = {
        ...nuevas[index],
        producto_id: prod.id,
        producto_codigo: prod.codigo,
        producto_nombre: prod.nombre,
        unidad_medida: prod.unidad_medida,
        cantidad: 1,
        costo_estimado: Number(prod.costo_ultimo || 0).toFixed(2)
      };
      return nuevas;
    });
    setProductosSugeridos([]);
    setTimeout(() => inputProductoRefs.current[index + 1]?.focus?.(), 0);
  }

  function calcularTotales() {
    let subtotal = 0;
    for (const l of lineas) {
      const cant = Number(l.cantidad) || 0;
      const costo = Number(l.costo_estimado) || 0;
      if (l.producto_id && cant > 0) subtotal += cant * costo;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const iva = Math.round(subtotal * 0.12 * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;
    setTotales({ subtotal, iva, total });
  }

  useEffect(() => { calcularTotales(); }, [lineas]);

  function agregarLinea() {
    setLineas(prev => [...prev, LINEA_INICIAL]);
  }

  function eliminarLinea(index) {
    if (lineas.length <= 1) return;
    setLineas(prev => prev.filter((_, i) => i !== index));
  }

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(valor);
  }

  async function generarDesdeStockBajo() {
    if (!form.proveedor_id) { setError('Primero seleccione un proveedor'); return; }
    try {
      setCargando(true);
      const res = await api.get('/ordenes-compra/stock-bajo', { params: { proveedor: form.proveedor_id } });
      const productosStockBajo = res.data;
      if (productosStockBajo.length === 0) {
        notificar.exito('No hay productos con stock bajo para este proveedor');
        return;
      }
      const nuevasLineas = productosStockBajo.map(p => ({
        producto_id: p.id,
        producto_codigo: p.codigo,
        producto_nombre: p.nombre,
        unidad_medida: p.unidad_medida,
        cantidad: p.cantidad_sugerida || Math.max(1, p.deficit),
        costo_estimado: p.costo_sugerido || p.costo_ultimo || 0
      }));
      setLineas(nuevasLineas);
      notificar.exito(`Se agregaron ${nuevasLineas.length} productos con stock bajo`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!form.proveedor_id) { setError('Falta seleccionar un proveedor'); return; }
    const lineasValidas = lineas.filter(l => l.producto_id && Number(l.cantidad) > 0 && Number(l.costo_estimado) >= 0);
    if (lineasValidas.length === 0) { setError('Debe agregar al menos un producto con cantidad y costo'); return; }

    const payload = {
      proveedor_id: Number(form.proveedor_id),
      fecha: form.fecha,
      fecha_esperada: form.fecha_esperada || null,
      estado: 'borrador',
      notas: form.notas.trim() || null,
      detalles: lineasValidas.map(l => ({
        producto_id: Number(l.producto_id),
        cantidad: Number(l.cantidad),
        costo_estimado: Number(l.costo_estimado)
      }))
    };

    setCargando(true);
    try {
      if (esAlta) {
        await api.post('/ordenes-compra', payload);
        onGuardado('Orden de compra creada correctamente');
      } else {
        await api.put(`/ordenes-compra/${orden.id}`, payload);
        onGuardado('Orden de compra actualizada correctamente');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo={esAlta ? 'Nueva orden de compra' : 'Editar orden de compra'} onCerrar={onCerrar} ancho="900px">
      <form onSubmit={enviar} className="formulario">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="form-grid" style={{ gap: '12px', marginBottom: '16px' }}>
          <label className="campo">
            <span>Proveedor *</span>
            <select className="control" value={form.proveedor_id} onChange={(e) => actualizarCampo('proveedor_id', e.target.value)} required>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.nit && `(${p.nit})`}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Fecha *</span>
            <input type="date" className="control" required value={form.fecha} onChange={(e) => actualizarCampo('fecha', e.target.value)} />
          </label>
          <label className="campo">
            <span>Fecha esperada entrega</span>
            <input type="date" className="control" value={form.fecha_esperada} onChange={(e) => actualizarCampo('fecha_esperada', e.target.value)} />
          </label>
        </div>

        <h4 style={{ margin: '16px 0 8px' }}>Productos</h4>
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{width:'40%'}}>Producto</th>
                <th style={{width:'10%',textAlign:'center'}}>Cant.</th>
                <th style={{width:'15%',textAlign:'right'}}>Costo est.</th>
                <th style={{width:'15%',textAlign:'right'}}>Subtotal</th>
                <th style={{width:'10%'}}></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, i) => (
                <tr key={i}>
                  <td>
                    <ProductoAutocompletar
                      valor={linea.producto_nombre}
                      onBuscar={buscarProductos}
                      sugerencias={productosSugeridos}
                      onSeleccionar={(p) => seleccionarProducto(i, p)}
                      onChange={(e) => actualizarLinea(i, 'producto_nombre', e.target.value)}
                      onBlur={() => setTimeout(() => setProductosSugeridos([]), 200)}
                      placeholder="Buscar por código o nombre..."
                      ref={el => inputProductoRefs.current[i] = el}
                    />
                    {linea.producto_id && (
                      <div style={{ fontSize: '12px', color: 'var(--color-texto-suave)', marginTop: '4px' }}>
                        Código: {linea.producto_codigo}
                      </div>
                    )}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <input
                      type="number" className="control" step="0.001" min="0.001"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(i, 'cantidad', e.target.value)}
                      style={{ width: '90px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{textAlign:'right'}}>
                    <input
                      type="number" className="control" step="0.01" min="0"
                      value={linea.costo_estimado}
                      onChange={(e) => actualizarLinea(i, 'costo_estimado', e.target.value)}
                      style={{ width: '120px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{textAlign:'right', fontWeight: 600}}>
                    {linea.producto_id && Number(linea.cantidad) > 0
                      ? formatearMoneda(Number(linea.cantidad) * Number(linea.costo_estimado))
                      : '—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    {lineas.length > 1 && (
                      <button type="button" className="btn btn-opcion btn-danger" style={{padding:'4px 8px',fontSize:'12px'}}
                        onClick={() => eliminarLinea(i)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lineas.length > 0 && (
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button type="button" className="btn btn-secundario" onClick={agregarLinea}>+ Agregar línea</button>
            {esAlta && (
              <button type="button" className="btn btn-secundario" style={{ marginLeft: '8px' }} onClick={generarDesdeStockBajo} disabled={cargando || !form.proveedor_id}>
                Generar desde stock bajo
              </button>
            )}
          </div>
        )}

        <div className="form-grid" style={{ marginTop: '16px', gap: '12px' }}>
          <label className="campo" style={{ gridColumn: '1 / -1' }}>
            <span>Notas</span>
            <textarea className="control" rows={2} value={form.notas} onChange={(e) => actualizarCampo('notas', e.target.value)} placeholder="Observaciones..." />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primario" disabled={cargando}>
            {cargando ? 'Guardando...' : esAlta ? 'Crear orden' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}