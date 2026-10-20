import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import ProveedorAutocompletar from './ProveedorAutocompletar';
import ProductoAutocompletar from './ProductoAutocompletar';

const FORM_INICIAL = {
  proveedor_id: '',
  proveedor_nombre: '',
  proveedor_dias_credito: 0,
  fecha: new Date().toISOString().split('T')[0],
  serie: '',
  numero_factura: '',
  condicion: 'contado',
  fecha_vencimiento: '',
  orden_compra_id: '',
  notas: '',
  adjunto_factura: null
};

const LINEA_INICIAL = {
  producto_id: '',
  producto_codigo: '',
  producto_nombre: '',
  unidad_medida: '',
  cantidad: '',
  costo_unitario: '',
  costo_anterior: 0
};

export default function NuevaCompraPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notificar = useNotificacion();

  const [form, setForm] = useState(FORM_INICIAL);
  const [lineas, setLineas] = useState([LINEA_INICIAL]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [totales, setTotales] = useState({ subtotal: 0, iva: 0, total: 0 });
  const [proveedoresSugeridos, setProveedoresSugeridos] = useState([]);
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [focoLinea, setFocoLinea] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(false);

  const inputCantidadRefs = useRef([]);
  const inputCostoRefs = useRef([]);
  const inputProductoRefs = useRef([]);

  useEffect(() => {
    const proveedorId = searchParams.get('proveedor');
    if (proveedorId) {
      cargarProveedor(proveedorId);
    }
  }, [searchParams]);

  async function cargarProveedor(id) {
    try {
      const res = await api.get(`/proveedores/${id}`);
      setForm(prev => ({
        ...prev,
        proveedor_id: res.data.id,
        proveedor_nombre: res.data.nombre,
        proveedor_dias_credito: res.data.dias_credito || 0
      }));
      setProveedorSeleccionado(true);
      actualizarFechaVencimiento();
    } catch (err) {
      console.error('Error cargando proveedor:', err);
    }
  }

  function actualizarFechaVencimiento() {
    if (form.condicion === 'credito' && form.proveedor_dias_credito > 0) {
      const fecha = new Date(form.fecha);
      fecha.setDate(fecha.getDate() + form.proveedor_dias_credito);
      setForm(prev => ({ ...prev, fecha_vencimiento: fecha.toISOString().split('T')[0] }));
    } else {
      setForm(prev => ({ ...prev, fecha_vencimiento: '' }));
    }
  }

  function actualizarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (campo === 'condicion' || campo === 'fecha' || campo === 'proveedor_dias_credito') {
      setTimeout(actualizarFechaVencimiento, 0);
    }
  }

  function actualizarLinea(index, campo, valor) {
    setLineas(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return nuevas;
    });
  }

  async function buscarProveedores(q) {
    if (!q || q.length < 2) { setProveedoresSugeridos([]); return; }
    try {
      const res = await api.get('/proveedores', { params: { q, estado: 'activo', pageSize: 10 } });
      setProveedoresSugeridos(res.data);
    } catch (err) { console.error(err); }
  }

  function seleccionarProveedor(p) {
    setForm(prev => ({
      ...prev,
      proveedor_id: p.id,
      proveedor_nombre: p.nombre,
      proveedor_dias_credito: p.dias_credito || 0
    }));
    setProveedoresSugeridos([]);
    setProveedorSeleccionado(true);
    actualizarFechaVencimiento();
    enfocarSiguienteCampo('fecha');
  }

  async function buscarProductos(q) {
    if (!q || q.length < 2) { setProductosSugeridos([]); return; }
    try {
      const res = await api.get('/productos/autocompletar', { params: { q, limite: 10 } });
      setProductosSugeridos(res.data);
    } catch (err) { console.error(err); }
  }

  function seleccionarProducto(index, prod) {
    const costoAnterior = Number(prod.costo_ultimo || 0);
    setLineas(prev => {
      const nuevas = [...prev];
      nuevas[index] = {
        ...nuevas[index],
        producto_id: prod.id,
        producto_codigo: prod.codigo,
        producto_nombre: prod.nombre,
        unidad_medida: prod.unidad_medida,
        cantidad: 1,
        costo_unitario: costoAnterior.toFixed(2),
        costo_anterior: costoAnterior
      };
      return nuevas;
    });
    setProductosSugeridos([]);
    setTimeout(() => enfocarCampo(index, 'cantidad'), 0);
  }

  function calcularTotales() {
    let subtotal = 0;
    for (const l of lineas) {
      const cant = Number(l.cantidad) || 0;
      const costo = Number(l.costo_unitario) || 0;
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
    setTimeout(() => enfocarCampo(lineas.length, 'producto'), 0);
  }

  function eliminarLinea(index) {
    if (lineas.length <= 1) return;
    setLineas(prev => prev.filter((_, i) => i !== index));
  }

  function enfocarCampo(index, campo) {
    const refs = campo === 'cantidad' ? inputCantidadRefs : campo === 'costo' ? inputCostoRefs : inputProductoRefs;
    if (refs.current[index]) {
      refs.current[index].focus();
      refs.current[index].select();
    }
  }

  function enfocarSiguienteCampo(campo) {
    if (campo === 'fecha') {
      const el = document.querySelector('input[name="fecha"]');
      if (el) el.focus();
    }
  }

  function manejarTeclaLinea(e, index) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const linea = lineas[index];
      if (linea.producto_id && Number(linea.cantidad) > 0 && Number(linea.costo_unitario) >= 0) {
        if (index === lineas.length - 1) {
          agregarLinea();
        } else {
          enfocarCampo(index + 1, 'producto');
        }
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (e.target.name === 'costo' && index === lineas.length - 1) {
        e.preventDefault();
        agregarLinea();
      }
    }
  }

  function hayCambiosSinGuardar() {
    return form.proveedor_id || lineas.some(l => l.producto_id);
  }

  useEffect(() => {
    const handler = (e) => {
      if (hayCambiosSinGuardar()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form, lineas]);

  async function guardar(yOtra = false) {
    setError('');
    if (!form.proveedor_id) { setError('Falta seleccionar un proveedor'); return; }
    const lineasValidas = lineas.filter(l => l.producto_id && Number(l.cantidad) > 0 && Number(l.costo_unitario) >= 0);
    if (lineasValidas.length === 0) { setError('Debe agregar al menos un producto con cantidad y costo'); return; }

    const payload = {
      proveedor_id: Number(form.proveedor_id),
      fecha: form.fecha,
      serie: form.serie.trim().toUpperCase() || null,
      numero_factura: form.numero_factura.trim().toUpperCase() || null,
      condicion: form.condicion,
      fecha_vencimiento: form.fecha_vencimiento || null,
      orden_compra_id: form.orden_compra_id ? Number(form.orden_compra_id) : null,
      notas: form.notas.trim() || null,
      adjunto_factura: form.adjunto_factura,
      detalles: lineasValidas.map(l => ({
        producto_id: Number(l.producto_id),
        cantidad: Number(l.cantidad),
        costo_unitario: Number(l.costo_unitario)
      }))
    };

    setGuardando(true);
    try {
      await api.post('/compras', payload);
      notificar.exito('Compra registrada correctamente');
      if (yOtra) {
        setForm(FORM_INICIAL);
        setLineas([LINEA_INICIAL]);
        setTotales({ subtotal: 0, iva: 0, total: 0 });
        setProveedorSeleccionado(false);
        setSearchParams({});
        inputProductoRefs.current[0]?.focus();
      } else {
        navigate('/compras');
      }
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(valor);
  }

  function indicadorCosto(costoActual, costoAnterior) {
    if (!costoAnterior) return null;
    const diff = Number(costoActual) - Number(costoAnterior);
    if (Math.abs(diff) < 0.01) return null;
    return diff > 0
      ? <span className="costo-indicador subio">▲ Subió {formatearMoneda(diff)}</span>
      : <span className="costo-indicador bajo">▼ Bajó {formatearMoneda(Math.abs(diff))}</span>;
  }

  return (
    <section style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 700px', minWidth: '320px' }}>
        <div className="encabezado-pagina">
          <h2>Nueva Compra</h2>
        </div>

        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="tabla-wrapper" style={{ marginBottom: '16px', padding: '16px' }}>
          <div className="form-grid" style={{ gap: '12px' }}>
            <label className="campo" style={{ gridColumn: '1 / -1' }}>
              <span>Proveedor *</span>
              <ProveedorAutocompletar
                valor={form.proveedor_nombre}
                onBuscar={buscarProveedores}
                sugerencias={proveedoresSugeridos}
                onSeleccionar={seleccionarProveedor}
                onChange={(e) => actualizarCampo('proveedor_nombre', e.target.value)}
                onBlur={() => setTimeout(() => setProveedoresSugeridos([]), 200)}
                placeholder="Escriba para buscar proveedor (mín. 2 caracteres)..."
                disabled={proveedorSeleccionado}
              />
              {proveedorSeleccionado && (
                <button type="button" className="btn btn-secundario" style={{ marginTop: '8px', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => { setForm(FORM_INICIAL); setProveedorSeleccionado(false); setSearchParams({}); }}>
                  Cambiar proveedor
                </button>
              )}
            </label>

            <label className="campo">
              <span>Fecha *</span>
              <input
                type="date"
                className="control"
                name="fecha"
                required
                value={form.fecha}
                onChange={(e) => actualizarCampo('fecha', e.target.value)}
              />
            </label>

            <label className="campo">
              <span>Serie</span>
              <input
                type="text"
                className="control"
                value={form.serie}
                onChange={(e) => actualizarCampo('serie', e.target.value.toUpperCase())}
                placeholder="A"
              />
            </label>

            <label className="campo">
              <span>N° Factura proveedor</span>
              <input
                type="text"
                className="control"
                value={form.numero_factura}
                onChange={(e) => actualizarCampo('numero_factura', e.target.value.toUpperCase())}
                placeholder="FAC-00123"
              />
            </label>

            <label className="campo">
              <span>Condición *</span>
              <select className="control" value={form.condicion} onChange={(e) => actualizarCampo('condicion', e.target.value)}>
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </label>

            {form.condicion === 'credito' && (
              <label className="campo">
                <span>Fecha vencimiento *</span>
                <input
                  type="date"
                  className="control"
                  required
                  value={form.fecha_vencimiento}
                  onChange={(e) => actualizarCampo('fecha_vencimiento', e.target.value)}
                  min={form.fecha}
                />
              </label>
            )}
          </div>
        </div>

        <h3 style={{ margin: '16px 0 8px' }}>Detalle de productos</h3>
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th style={{width:'40%'}}>Producto</th>
                <th style={{width:'10%',textAlign:'center'}}>Cant.</th>
                <th style={{width:'15%',textAlign:'right'}}>Costo unit.</th>
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
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Código: {linea.producto_codigo} | Stock: {Number(linea.stock || 0).toLocaleString('es-GT', {minimumFractionDigits: 2})} {linea.unidad_medida}
                      </div>
                    )}
                    {indicadorCosto(linea.costo_unitario, linea.costo_anterior)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <input
                      type="number"
                      className="control"
                      step="0.001"
                      min="0.001"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(i, 'cantidad', e.target.value)}
                      onKeyDown={(e) => manejarTeclaLinea(e, i)}
                      ref={el => inputCantidadRefs.current[i] = el}
                      style={{ width: '90px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{textAlign:'right'}}>
                    <input
                      type="number"
                      className="control"
                      step="0.01"
                      min="0"
                      value={linea.costo_unitario}
                      onChange={(e) => actualizarLinea(i, 'costo_unitario', e.target.value)}
                      onKeyDown={(e) => manejarTeclaLinea(e, i)}
                      ref={el => inputCostoRefs.current[i] = el}
                      style={{ width: '120px', padding: '6px 8px', textAlign: 'right' }}
                    />
                  </td>
                  <td style={{textAlign:'right', fontWeight: 600, fontSize: '14px'}}>
                    {linea.producto_id && Number(linea.cantidad) > 0
                      ? formatearMoneda(Number(linea.cantidad) * Number(linea.costo_unitario))
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
            <button type="button" className="btn btn-secundario" onClick={agregarLinea}>+ Agregar otra línea</button>
          </div>
        )}
      </div>

      <div style={{ flex: '0 0 320px', position: 'sticky', top: '120px' }}>
        <div className="tarjeta" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', textAlign: 'center' }}>Resumen</h3>
          <div className="form-grid" style={{ gap: '12px' }}>
            <div className="campo"><span>Subtotal</span> <strong>{formatearMoneda(totales.subtotal)}</strong></div>
            <div className="campo"><span>IVA (12%)</span> <strong>{formatearMoneda(totales.iva)}</strong></div>
            <div className="campo" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px' }}>
              <span>Total</span>
              <strong style={{ fontSize: '28px', color: '#ea580c' }}>{formatearMoneda(totales.total)}</strong>
            </div>
            {form.condicion === 'credito' && form.fecha_vencimiento && (
              <div className="campo" style={{ gridColumn: '1 / -1', background: '#fff7ed', padding: '10px', borderRadius: '8px' }}>
                <span>Vence el</span>
                <strong>{new Date(form.fecha_vencimiento).toLocaleDateString('es-GT')}</strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primario"
              style={{ flex: 1, minWidth: '140px' }}
              onClick={() => guardar(false)}
              disabled={guardando || !form.proveedor_id || lineas.filter(l => l.producto_id && Number(l.cantidad) > 0 && Number(l.costo_unitario) >= 0).length === 0}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              style={{ flex: 1, minWidth: '140px' }}
              onClick={() => guardar(true)}
              disabled={guardando || !form.proveedor_id || lineas.filter(l => l.producto_id && Number(l.cantidad) > 0 && Number(l.costo_unitario) >= 0).length === 0}
            >
              Guardar y otra
            </button>
          </div>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            Enter en costo: agrega línea | Tab: navega | Foco auto en producto tras agregar
          </p>
        </div>

        <div className="tarjeta" style={{ marginTop: '16px', padding: '16px' }}>
          <h4 style={{ margin: '0 0 12px' }}>Notas</h4>
          <textarea
            className="control"
            rows={3}
            value={form.notas}
            onChange={(e) => actualizarCampo('notas', e.target.value)}
            placeholder="Observaciones internas..."
          />
        </div>
      </div>

      <style jsx>{`
        .costo-indicador { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }
        .costo-indicador.subio { background: #fee2e2; color: #dc2626; }
        .costo-indicador.bajo { background: #dcfce7; color: #16a34a; }
      `}</style>
    </section>
  );
}