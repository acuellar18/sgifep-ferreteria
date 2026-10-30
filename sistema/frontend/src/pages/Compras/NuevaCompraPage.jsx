import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import ProveedorAutocompletar from './ProveedorAutocompletar';
import ProductoAutocompletar from './ProductoAutocompletar';
import FlujoCompras from './FlujoCompras';

// Fecha de hoy en hora local (evita que en la noche salga el día siguiente)
function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Calcula la fecha de vencimiento con los valores recibidos (no con el estado viejo)
function calcularVencimiento(fecha, condicion, dias) {
  if (condicion === 'credito' && Number(dias) > 0 && fecha) {
    const f = new Date(`${fecha}T00:00:00`);
    f.setDate(f.getDate() + Number(dias));
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const dia = String(f.getDate()).padStart(2, '0');
    return `${f.getFullYear()}-${mes}-${dia}`;
  }
  return '';
}

const FORM_INICIAL = {
  proveedor_id: '',
  proveedor_nombre: '',
  proveedor_dias_credito: 0,
  fecha: hoyLocal(),
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
  precio_compra: '',
  precio_venta: '',
  margen: '',
  es_nuevo: false,
  costo_anterior: 0
};

export default function NuevaCompraPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notificar = useNotificacion();

  const [form, setForm] = useState(FORM_INICIAL);
  const [lineas, setLineas] = useState([LINEA_INICIAL]);
  const [error, setError] = useState('');
  const [totales, setTotales] = useState({ subtotal: 0, iva: 0, total: 0 });
  const [proveedoresSugeridos, setProveedoresSugeridos] = useState([]);
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(false);

  const inputCantidadRefs = useRef([]);
  const inputCostoRefs = useRef([]);
  const inputProductoRefs = useRef([]);
  const inputPrecioVentaRefs = useRef([]);

  useEffect(() => {
    const proveedorId = searchParams.get('proveedor');
    if (proveedorId) {
      cargarProveedor(proveedorId);
    }
  }, [searchParams]);

  async function cargarProveedor(id) {
    try {
      const res = await api.get(`/proveedores/${id}`);
      const dias = res.data.dias_credito || 0;
      setForm(prev => ({
        ...prev,
        proveedor_id: res.data.id,
        proveedor_nombre: res.data.nombre,
        proveedor_dias_credito: dias,
        fecha_vencimiento: calcularVencimiento(prev.fecha, prev.condicion, dias)
      }));
      setProveedorSeleccionado(true);
    } catch (err) {
      console.error('Error cargando proveedor:', err);
    }
  }

  function actualizarCampo(campo, valor) {
    setForm(prev => {
      const siguiente = { ...prev, [campo]: valor };
      if (campo === 'condicion' || campo === 'fecha') {
        siguiente.fecha_vencimiento = calcularVencimiento(
          siguiente.fecha,
          siguiente.condicion,
          siguiente.proveedor_dias_credito
        );
      }
      return siguiente;
    });
  }

  function actualizarLinea(index, campo, valor) {
    setLineas(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      if (campo === 'precio_compra' || campo === 'margen') {
        const precioCompra = Number(campo === 'precio_compra' ? valor : nuevas[index].precio_compra) || 0;
        const margen = Number(campo === 'margen' ? valor : nuevas[index].margen) || 0;
        if (margen >= 0 && precioCompra >= 0) {
          nuevas[index].precio_venta = (precioCompra * (1 + margen / 100)).toFixed(2);
        }
      }
      if (campo === 'precio_venta') {
        const precioCompra = Number(nuevas[index].precio_compra) || 0;
        const precioVenta = Number(valor) || 0;
        if (precioCompra > 0 && precioVenta >= precioCompra) {
          nuevas[index].margen = ((precioVenta / precioCompra - 1) * 100).toFixed(2);
        } else if (precioCompra > 0) {
          nuevas[index].margen = '';
        }
      }
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
    const dias = p.dias_credito || 0;
    setForm(prev => ({
      ...prev,
      proveedor_id: p.id,
      proveedor_nombre: p.nombre,
      proveedor_dias_credito: dias,
      fecha_vencimiento: calcularVencimiento(prev.fecha, prev.condicion, dias)
    }));
    setProveedoresSugeridos([]);
    setProveedorSeleccionado(true);
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
        cantidad: nuevas[index].cantidad || 1,
        precio_compra: costoAnterior.toFixed(2),
        precio_venta: Number(prod.precio_venta || 0).toFixed(2),
        margen: costoAnterior > 0 && Number(prod.precio_venta) >= costoAnterior
          ? (((Number(prod.precio_venta) / costoAnterior) - 1) * 100).toFixed(2)
          : '',
        es_nuevo: false,
        costo_anterior: costoAnterior
      };
      return nuevas;
    });
    setProductosSugeridos([]);
    setTimeout(() => enfocarCampo(index, 'cantidad'), 0);
  }

  function marcarProductoNuevo(index) {
    setLineas(prev => {
      const nuevas = [...prev];
      const nombre = nuevas[index].producto_nombre || '';
      nuevas[index] = {
        ...nuevas[index],
        producto_id: '',
        producto_codigo: '',
        es_nuevo: nombre.trim() ? true : nuevas[index].es_nuevo
      };
      return nuevas;
    });
  }

  function calcularTotales() {
    let subtotal = 0;
    for (const l of lineas) {
      const cant = Number(l.cantidad) || 0;
      const costo = Number(l.precio_compra) || 0;
      if ((l.producto_id || l.es_nuevo) && cant > 0 && costo >= 0) subtotal += cant * costo;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const iva = Math.round(subtotal * 0.12 * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;
    setTotales({ subtotal, iva, total });
  }

  useEffect(() => { calcularTotales(); }, [lineas]);

  function agregarLinea() {
    setLineas(prev => [...prev, { ...LINEA_INICIAL }]);
    setTimeout(() => enfocarCampo(lineas.length, 'producto'), 0);
  }

  function eliminarLinea(index) {
    if (lineas.length <= 1) return;
    setLineas(prev => prev.filter((_, i) => i !== index));
  }

  function enfocarCampo(index, campo) {
    const refs = campo === 'cantidad'
      ? inputCantidadRefs
      : campo === 'costo'
        ? inputCostoRefs
        : campo === 'precio_venta'
          ? inputPrecioVentaRefs
          : inputProductoRefs;
    if (refs.current[index]) {
      refs.current[index].focus();
      refs.current[index].select?.();
    }
  }

  function hayCambiosSinGuardar() {
    return form.proveedor_id || lineas.some(l => l.producto_id || l.producto_nombre);
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
    const lineasValidas = [];
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const cant = Number(l.cantidad);
      const precioCompra = Number(l.precio_compra);
      const precioVenta = Number(l.precio_venta);
      if (!l.producto_id && !l.producto_nombre.trim()) continue;
      if (!Number.isFinite(cant) || cant <= 0) { setError(`Línea ${i + 1}: La cantidad debe ser mayor a 0`); return; }
      if (!Number.isFinite(precioCompra) || precioCompra < 0) { setError(`Línea ${i + 1}: El precio de compra no puede ser negativo`); return; }
      if (!Number.isFinite(precioVenta) || precioVenta < 0) { setError(`Línea ${i + 1}: El precio de venta no puede ser negativo`); return; }
      if (precioVenta < precioCompra) { setError(`Línea ${i + 1}: El precio de venta no puede ser menor al precio de compra`); return; }
      lineasValidas.push({
        producto_id: l.producto_id ? Number(l.producto_id) : null,
        producto_nombre: l.es_nuevo || !l.producto_id ? l.producto_nombre.trim() : undefined,
        cantidad: cant,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        margen: l.margen !== '' ? Number(l.margen) : undefined
      });
    }
    if (lineasValidas.length === 0) { setError('Debe agregar al menos un producto con cantidad, precio de compra y precio de venta'); return; }

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
      detalles: lineasValidas
    };

    setGuardando(true);
    try {
      await api.post('/compras', payload);
      notificar.exito('Compra registrada correctamente. Inventario actualizado.');
      if (yOtra) {
        setForm({ ...FORM_INICIAL, fecha: hoyLocal() });
        setLineas([{ ...LINEA_INICIAL }]);
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
      ? <span className="costo-indicador subio"> Subió {formatearMoneda(diff)}</span>
      : <span className="costo-indicador bajo"> Bajó {formatearMoneda(Math.abs(diff))}</span>;
  }

  return (
    <div className="pagina compra-nueva">
      <div className="pagina-cabecera">
        <div>
          <h1>Nueva compra</h1>
          <p>Registrar compra a proveedor (genera o actualiza inventario automáticamente)</p>
        </div>
        <div className="pagina-acciones">
          <Link to="/compras" className="btn btn-secundario">Volver</Link>
        </div>
      </div>

      <FlujoCompras pasoActivo={2} />

      <div className="compra-grid">
        <div className="compra-col">
          <div className="tarjeta tarjeta-sombra">
            <div className="tarjeta-cabecera">
              <h2>Datos de la factura</h2>
            </div>
            <div className="formulario-grid formulario-grid-3">
              <div className="campo campo-completo">
                <label>Proveedor *</label>
                <div style={{ width: '100%' }}>
                  <ProveedorAutocompletar
                    valor={form.proveedor_nombre}
                    onBuscar={buscarProveedores}
                    sugerencias={proveedoresSugeridos}
                    onSeleccionar={seleccionarProveedor}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, proveedor_nombre: e.target.value, proveedor_id: '', proveedor_dias_credito: 0 }));
                      setProveedorSeleccionado(false);
                      buscarProveedores(e.target.value);
                    }}
                    placeholder="Buscar proveedor por nombre o NIT"
                  />
                </div>
              </div>
              <div className="campo">
                <label>Fecha *</label>
                <input type="date" name="fecha" className="control" value={form.fecha} onChange={(e) => actualizarCampo('fecha', e.target.value)} />
              </div>
              <div className="campo">
                <label>Serie</label>
                <input className="control" value={form.serie} onChange={(e) => actualizarCampo('serie', e.target.value)} placeholder="A" maxLength={20} />
              </div>
              <div className="campo">
                <label>Número de factura</label>
                <input className="control" value={form.numero_factura} onChange={(e) => actualizarCampo('numero_factura', e.target.value)} placeholder="123456" maxLength={50} />
              </div>
              <div className="campo">
                <label>Condición</label>
                <select className="control" value={form.condicion} onChange={(e) => actualizarCampo('condicion', e.target.value)}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              {form.condicion === 'credito' && (
                <div className="campo">
                  <label>Fecha de vencimiento *</label>
                  <input type="date" className="control" value={form.fecha_vencimiento} onChange={(e) => actualizarCampo('fecha_vencimiento', e.target.value)} />
                </div>
              )}
              <div className="campo campo-completo">
                <label>Notas</label>
                <textarea className="control" rows="2" value={form.notas} onChange={(e) => actualizarCampo('notas', e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>
          </div>

          <div className="tarjeta tarjeta-sombra">
            <div className="tarjeta-cabecera tarjeta-cabecera-flex">
              <h2>Detalle de productos</h2>
              <button type="button" className="btn btn-secundario btn-agregar-linea" onClick={agregarLinea}>+ Agregar línea</button>
            </div>
            <p className="ayuda-texto">Si el producto no existe, escribe el nombre y completa precio de compra y precio de venta para crearlo automáticamente.</p>
            <div className="tabla-contenedor tabla-compras-contenedor">
              <table className="tabla tabla-compras">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Producto</th>
                    <th style={{ width: '10%' }}>Cantidad</th>
                    <th style={{ width: '12%' }}>Precio compra (sin IVA)</th>
                    <th style={{ width: '10%' }}>% Margen</th>
                    <th style={{ width: '12%' }}>Precio venta</th>
                    <th style={{ width: '12%' }}>Subtotal</th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, index) => {
                    const cant = Number(linea.cantidad) || 0;
                    const precioC = Number(linea.precio_compra) || 0;
                    const subtotalLinea = cant * precioC;
                    return (
                      <tr key={index}>
                        <td style={{ position: 'relative' }}>
                          <ProductoAutocompletar
                            valor={linea.producto_nombre}
                            onBuscar={(q) => {
                              buscarProductos(q);
                              actualizarLinea(index, 'producto_nombre', q);
                              setLineas(prev => { const n = [...prev]; n[index] = { ...n[index], es_nuevo: false, producto_id: '' }; return n; });
                            }}
                            sugerencias={productosSugeridos}
                            onSeleccionar={(p) => seleccionarProducto(index, p)}
                            onChange={(e) => {
                              actualizarLinea(index, 'producto_nombre', e.target.value);
                              setLineas(prev => { const n = [...prev]; n[index] = { ...n[index], es_nuevo: false, producto_id: '' }; return n; });
                            }}
                            onBlur={() => {
                              setTimeout(() => setProductosSugeridos([]), 150);
                              if (!linea.producto_id && linea.producto_nombre.trim()) marcarProductoNuevo(index);
                            }}
                            placeholder="Buscar o escribir nombre para crear"
                            ref={(el) => (inputProductoRefs.current[index] = el)}
                          />
                          {linea.es_nuevo && <small className="texto-nuevo">Se creará como producto nuevo</small>}
                          {linea.producto_codigo && <small className="texto-suave">Código: {linea.producto_codigo}</small>}
                          {linea.costo_anterior > 0 && indicadorCosto(linea.precio_compra, linea.costo_anterior)}
                        </td>
                        <td>
                          <input type="number" min="1" step="1" className="control control-tabla" value={linea.cantidad} onChange={(e) => actualizarLinea(index, 'cantidad', e.target.value)} ref={(el) => (inputCantidadRefs.current[index] = el)} />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.01" className="control control-tabla" value={linea.precio_compra} onChange={(e) => actualizarLinea(index, 'precio_compra', e.target.value)} ref={(el) => (inputCostoRefs.current[index] = el)} />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.01" className="control control-tabla" value={linea.margen} onChange={(e) => actualizarLinea(index, 'margen', e.target.value)} placeholder="%" />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.01" className="control control-tabla" value={linea.precio_venta} onChange={(e) => actualizarLinea(index, 'precio_venta', e.target.value)} ref={(el) => (inputPrecioVentaRefs.current[index] = el)} />
                        </td>
                        <td className="col-subtotal">{formatearMoneda(subtotalLinea)}</td>
                        <td>
                          <button type="button" className="btn-icono-eliminar" onClick={() => eliminarLinea(index)} disabled={lineas.length === 1} title="Eliminar línea">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4H14M5.333 4V2.667A1.333 1.333 0 016.667 1.334h2.666A1.333 1.333 0 0110.667 2.667V4M12.667 4V13.334A1.333 1.333 0 0111.334 14.667H4.667A1.333 1.333 0 013.334 13.334V4H12.667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="compra-col compra-col-resumen">
          <div className="tarjeta tarjeta-sombra tarjeta-totales">
            <div className="tarjeta-cabecera">
              <h2>Resumen</h2>
            </div>
            <div className="totales-lista">
              <div className="totales-fila">
                <span>Subtotal (sin IVA)</span>
                <span>{formatearMoneda(totales.subtotal)}</span>
              </div>
              <div className="totales-fila">
                <span>IVA 12%</span>
                <span>{formatearMoneda(totales.iva)}</span>
              </div>
              <div className="totales-separador"></div>
              <div className="totales-fila totales-total">
                <span>Total</span>
                <span>{formatearMoneda(totales.total)}</span>
              </div>
            </div>
            <p className="ayuda-campo">El precio de compra se registra sin IVA. El costo del producto se guarda sin IVA.</p>
          </div>

          {error && <div className="alerta alerta-error">{error}</div>}

          <div className="acciones-compra">
            <button type="button" className="btn btn-secundario" onClick={() => guardar(true)} disabled={guardando || !proveedorSeleccionado}>
              {guardando ? 'Guardando...' : 'Guardar y registrar otra'}
            </button>
            <button type="button" className="btn btn-primario" onClick={() => guardar(false)} disabled={guardando || !proveedorSeleccionado}>
              {guardando ? 'Guardando...' : 'Guardar compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}