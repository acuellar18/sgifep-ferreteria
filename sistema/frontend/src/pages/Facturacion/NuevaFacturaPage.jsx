import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';
import { rutaImpresionFacturaVenta } from '../../utils/rutasFacturacion';
import ClienteAutocompletar from './ClienteAutocompletar';
import ProductoFacturaAutocompletar from './ProductoFacturaAutocompletar';

const hoy = () => new Date().toISOString().slice(0, 10);

const FORM_INICIAL = {
  cliente_id: '',
  cliente_nombre: '',
  cliente_nit: '',
  cliente_dias_credito: 0,
  fecha: hoy(),
  condicion: 'contado',
  fecha_vencimiento: '',
  notas: ''
};

const LINEA_INICIAL = {
  producto_id: '',
  producto_codigo: '',
  producto_nombre: '',
  unidad_medida: '',
  tipo: 'producto',
  stock: 0,
  cantidad: '',
  precio_unitario: ''
};

function sumarDias(fecha, dias) {
  const date = new Date(`${fecha}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(dias || 0));
  return date.toISOString().slice(0, 10);
}

function redondear2(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export default function NuevaFacturaPage() {
  const navigate = useNavigate();
  const notificar = useNotificacion();

  const [form, setForm] = useState(FORM_INICIAL);
  const [lineas, setLineas] = useState([LINEA_INICIAL]);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [productosSugeridos, setProductosSugeridos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (form.condicion !== 'credito') {
      if (form.fecha_vencimiento) {
        setForm((prev) => ({ ...prev, fecha_vencimiento: '' }));
      }
      return;
    }
    if (!form.fecha) return;
    const dias = Number(form.cliente_dias_credito);
    const vencimiento = dias > 0 ? sumarDias(form.fecha, dias) : form.fecha;
    setForm((prev) => (
      prev.fecha_vencimiento === vencimiento
        ? prev
        : { ...prev, fecha_vencimiento: vencimiento }
    ));
  }, [form.condicion, form.fecha, form.cliente_dias_credito]);

  const totales = useMemo(() => {
    let subtotal = 0;
    for (const linea of lineas) {
      if (!linea.producto_id) continue;
      const cantidad = Number(linea.cantidad) || 0;
      const precio = Number(linea.precio_unitario) || 0;
      if (cantidad > 0) subtotal = redondear2(subtotal + redondear2(cantidad * precio));
    }
    const iva = redondear2(subtotal * 0.12);
    return { subtotal, iva, total: redondear2(subtotal + iva) };
  }, [lineas]);

  const lineasValidas = lineas.filter((linea) => {
    const precio = Number(linea.precio_unitario);
    return Boolean(
      linea.producto_id &&
      Number(linea.cantidad) > 0 &&
      linea.precio_unitario !== '' &&
      linea.precio_unitario != null &&
      Number.isFinite(precio) &&
      precio >= 0
    );
  });

  const lineasConProblema = lineas.some((linea) => {
    if (!linea.producto_id) return false;
    const cantidad = Number(linea.cantidad);
    const precio = Number(linea.precio_unitario);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return true;
    if (linea.precio_unitario === '' || linea.precio_unitario == null || !Number.isFinite(precio) || precio < 0) return true;
    if (linea.tipo !== 'servicio' && cantidad > Number(linea.stock || 0)) return true;
    return false;
  });

  const productosDuplicados = useMemo(() => {
    const ids = lineas.filter((linea) => linea.producto_id).map((linea) => Number(linea.producto_id));
    return new Set(ids).size !== ids.length;
  }, [lineas]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function buscarClientes(q) {
    if (!q || q.length < 2) {
      setClientesSugeridos([]);
      return;
    }
    try {
      const res = await api.get('/clientes', { params: { q, estado: 'activo', pageSize: 10 } });
      setClientesSugeridos(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function seleccionarCliente(cliente) {
    setForm((prev) => ({
      ...prev,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_nit: cliente.nit,
      cliente_dias_credito: Number(cliente.dias_credito || 0)
    }));
    setClienteSeleccionado(true);
    setClientesSugeridos([]);
  }

  function cambiarCliente() {
    setClienteSeleccionado(false);
    setForm((prev) => ({
      ...prev,
      cliente_id: '',
      cliente_nombre: '',
      cliente_nit: '',
      cliente_dias_credito: 0
    }));
  }

  async function buscarProductos(q) {
    if (!q || q.length < 2) {
      setProductosSugeridos([]);
      return;
    }
    try {
      const res = await api.get('/facturas/productos', { params: { q, limite: 10 } });
      setProductosSugeridos(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function actualizarLinea(indice, campo, valor) {
    setLineas((prev) => {
      const nuevas = [...prev];
      nuevas[indice] = { ...nuevas[indice], [campo]: valor };
      return nuevas;
    });
  }

  function cambiarNombreProducto(indice, valor) {
    setLineas((prev) => {
      const nuevas = [...prev];
      const linea = nuevas[indice];
      nuevas[indice] = linea.producto_nombre === valor
        ? { ...linea, producto_nombre: valor }
        : {
            ...linea,
            producto_nombre: valor,
            producto_id: '',
            producto_codigo: '',
            unidad_medida: '',
            tipo: 'producto',
            stock: 0
          };
      return nuevas;
    });
  }

  function seleccionarProducto(indice, producto) {
    const repetido = lineas.some(
      (linea, posicion) => posicion !== indice && Number(linea.producto_id) === Number(producto.id)
    );
    if (repetido) {
      notificar.error('Ese producto ya está agregado en la factura');
      return;
    }

    setLineas((prev) => {
      const nuevas = [...prev];
      nuevas[indice] = {
        ...nuevas[indice],
        producto_id: producto.id,
        producto_codigo: producto.codigo,
        producto_nombre: producto.nombre,
        unidad_medida: producto.unidad_medida,
        tipo: producto.tipo,
        stock: Number(producto.stock_actual || 0),
        cantidad: 1,
        precio_unitario: Number(producto.precio_venta || 0).toFixed(2)
      };
      return nuevas;
    });
    setProductosSugeridos([]);
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, LINEA_INICIAL]);
  }

  function eliminarLinea(indice) {
    if (lineas.length <= 1) return;
    setLineas((prev) => prev.filter((_, posicion) => posicion !== indice));
  }

  function manejarEnterLinea(evento, indice) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    const linea = lineas[indice];
    if (linea.producto_id && Number(linea.cantidad) > 0) {
      if (indice === lineas.length - 1) agregarLinea();
    }
  }

  async function guardar(imprimir = false) {
    if (guardando) return;
    setError('');
    if (!form.cliente_id) {
      setError('Falta seleccionar un cliente');
      return;
    }
    if (!form.fecha) {
      setError('La fecha de la factura es requerida');
      return;
    }
    if (lineasValidas.length === 0) {
      setError('Debe agregar al menos un producto o servicio');
      return;
    }
    if (lineasConProblema) {
      setError('Revise las cantidades: hay líneas sin cantidad o con stock insuficiente');
      return;
    }
    if (productosDuplicados) {
      setError('No puede repetir el mismo producto en la factura');
      return;
    }
    if (form.condicion === 'credito' && form.fecha_vencimiento && form.fecha_vencimiento < form.fecha) {
      setError('La fecha de vencimiento no puede ser anterior a la fecha de la factura');
      return;
    }

    const payload = {
      cliente_id: Number(form.cliente_id),
      fecha: form.fecha,
      condicion: form.condicion,
      fecha_vencimiento: form.condicion === 'credito' ? form.fecha_vencimiento || null : null,
      notas: form.notas.trim() || null,
      detalles: lineasValidas.map((linea) => ({
        producto_id: Number(linea.producto_id),
        cantidad: Number(linea.cantidad),
        precio_unitario: Number(linea.precio_unitario)
      }))
    };

    const ventanaImpresion = imprimir ? window.open('', '_blank') : null;
    setGuardando(true);
    try {
      const res = await api.post('/facturas', payload);
      notificar.exito(`Factura ${res.data?.numero || ''} emitida correctamente`);
      if (imprimir && res.data?.id) {
        const ruta = rutaImpresionFacturaVenta(res.data.id);
        if (ventanaImpresion) ventanaImpresion.location.href = ruta;
        else window.open(ruta, '_blank', 'noopener');
      } else if (ventanaImpresion) {
        ventanaImpresion.close();
      }
      navigate('/facturacion/facturas');
    } catch (err) {
      if (ventanaImpresion) ventanaImpresion.close();
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="facturacion-nueva">
      <div className="encabezado-pagina">
        <div>
          <h2>Nueva factura de venta</h2>
          <p className="reporte-detalle">
            Selecciona el cliente y agrega productos o servicios. El IVA del 12% se calcula automáticamente
            y el inventario se descuenta al emitir.
          </p>
        </div>
        <Link to="/facturacion/facturas" className="btn btn-secundario">
          Volver al listado
        </Link>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="facturacion-nueva-layout">
        <div className="facturacion-nueva-principal">
          <div className="tabla-wrapper facturacion-panel">
            <div className="form-grid">
              <label className="campo facturacion-form-completo">
                <span>Cliente *</span>
                <ClienteAutocompletar
                  valor={form.cliente_nombre}
                  onBuscar={buscarClientes}
                  sugerencias={clientesSugeridos}
                  onSeleccionar={seleccionarCliente}
                  onChange={(evento) => actualizarCampo('cliente_nombre', evento.target.value)}
                  onBlur={() => setTimeout(() => setClientesSugeridos([]), 200)}
                  disabled={clienteSeleccionado}
                  placeholder="Escriba el nombre o NIT del cliente (mín. 2 caracteres)..."
                />
                {clienteSeleccionado && (
                  <div className="facturacion-cliente-elegido">
                    <span>NIT {form.cliente_nit || 'CF'}</span>
                    {Number(form.cliente_dias_credito) > 0 && (
                      <span>Crédito {form.cliente_dias_credito} días</span>
                    )}
                    <button type="button" className="btn btn-opcion" onClick={cambiarCliente}>
                      Cambiar cliente
                    </button>
                  </div>
                )}
                <p className="ayuda-campo">
                  ¿No aparece el cliente?{' '}
                  <Link to="/facturacion/clientes" target="_blank" rel="noreferrer">
                    Regístralo primero
                  </Link>.
                </p>
              </label>

              <label className="campo">
                <span>Fecha *</span>
                <input
                  type="date"
                  className="control"
                  value={form.fecha}
                  onChange={(evento) => actualizarCampo('fecha', evento.target.value)}
                />
              </label>

              <label className="campo">
                <span>Condición *</span>
                <select
                  className="control"
                  value={form.condicion}
                  onChange={(evento) => actualizarCampo('condicion', evento.target.value)}
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </label>

              {form.condicion === 'credito' && (
                <label className="campo">
                  <span>Fecha de vencimiento</span>
                  <input
                    type="date"
                    className="control"
                    min={form.fecha}
                    value={form.fecha_vencimiento}
                    onChange={(evento) => actualizarCampo('fecha_vencimiento', evento.target.value)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="facturacion-lineas-encabezado">
            <h3>Detalle de la factura</h3>
            <button type="button" className="btn btn-secundario" onClick={agregarLinea}>
              + Agregar línea
            </button>
          </div>

          <div className="tabla-wrapper">
            <table className="tabla facturacion-tabla-lineas">
              <thead>
                <tr>
                  <th className="facturacion-col-producto">Producto o servicio</th>
                  <th className="facturacion-col-cantidad">Cantidad</th>
                  <th className="facturacion-col-precio">Precio unit.</th>
                  <th className="facturacion-col-subtotal">Subtotal</th>
                  <th className="facturacion-col-acciones"></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, indice) => {
                  const cantidad = Number(linea.cantidad);
                  const excedeStock = Boolean(
                    linea.producto_id &&
                    linea.tipo !== 'servicio' &&
                    Number.isFinite(cantidad) &&
                    cantidad > Number(linea.stock || 0)
                  );
                  return (
                    <tr key={indice}>
                      <td>
                        <ProductoFacturaAutocompletar
                          valor={linea.producto_nombre}
                          onBuscar={buscarProductos}
                          sugerencias={productosSugeridos}
                          onSeleccionar={(producto) => seleccionarProducto(indice, producto)}
                          onChange={(evento) => cambiarNombreProducto(indice, evento.target.value)}
                          onBlur={() => setTimeout(() => setProductosSugeridos([]), 200)}
                        />
                        {linea.producto_id && (
                          <div className={`facturacion-linea-info${excedeStock ? ' facturacion-linea-error' : ''}`}>
                            <span>Código: {linea.producto_codigo}</span>
                            <span>
                              {linea.tipo === 'servicio'
                                ? 'Servicio'
                                : `Stock: ${formatearNumero(linea.stock, 0)} ${linea.unidad_medida}`}
                            </span>
                            {excedeStock && <strong>Stock insuficiente</strong>}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="control facturacion-input-numero"
                          step="0.001"
                          min="0.001"
                          value={linea.cantidad}
                          onChange={(evento) => actualizarLinea(indice, 'cantidad', evento.target.value)}
                          onKeyDown={(evento) => manejarEnterLinea(evento, indice)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="control facturacion-input-numero"
                          step="0.01"
                          min="0"
                          value={linea.precio_unitario}
                          onChange={(evento) => actualizarLinea(indice, 'precio_unitario', evento.target.value)}
                          onKeyDown={(evento) => manejarEnterLinea(evento, indice)}
                        />
                      </td>
                      <td className="reporte-numero">
                        {linea.producto_id && Number(linea.cantidad) > 0
                          ? formatearMoneda(Number(linea.cantidad) * Number(linea.precio_unitario))
                          : '—'}
                      </td>
                      <td className="facturacion-col-acciones">
                        {lineas.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-opcion btn-danger facturacion-btn-eliminar"
                            onClick={() => eliminarLinea(indice)}
                            aria-label="Eliminar línea"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="facturacion-nueva-resumen">
          <div className="tarjeta facturacion-resumen-card">
            <h3>Resumen</h3>
            <div className="facturacion-resumen-fila">
              <span>Subtotal</span>
              <strong>{formatearMoneda(totales.subtotal)}</strong>
            </div>
            <div className="facturacion-resumen-fila">
              <span>IVA (12%)</span>
              <strong>{formatearMoneda(totales.iva)}</strong>
            </div>
            <div className="facturacion-resumen-fila facturacion-resumen-total">
              <span>Total</span>
              <strong>{formatearMoneda(totales.total)}</strong>
            </div>
            {form.condicion === 'credito' && form.fecha_vencimiento && (
              <div className="facturacion-resumen-vencimiento">
                <span>Vence el</span>
                <strong>{form.fecha_vencimiento.split('-').reverse().join('/')}</strong>
              </div>
            )}
            <div className="facturacion-resumen-acciones">
              <button
                type="button"
                className="btn btn-primario"
                onClick={() => guardar(false)}
                disabled={guardando || !form.fecha || !form.cliente_id || lineasValidas.length === 0 || lineasConProblema || productosDuplicados}
              >
                {guardando ? 'Emitiendo...' : 'Emitir factura'}
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => guardar(true)}
                disabled={guardando || !form.fecha || !form.cliente_id || lineasValidas.length === 0 || lineasConProblema || productosDuplicados}
              >
                Emitir e imprimir
              </button>
            </div>
            <p className="facturacion-resumen-ayuda">
              Al emitir se descuenta el stock de los productos. Los servicios no afectan inventario.
            </p>
          </div>

          <div className="tarjeta facturacion-notas-card">
            <label className="campo">
              <span>Notas</span>
              <textarea
                className="control"
                rows={4}
                maxLength={500}
                value={form.notas}
                onChange={(evento) => actualizarCampo('notas', evento.target.value)}
                placeholder="Observaciones para la factura..."
              />
            </label>
          </div>
        </aside>
      </div>
    </section>
  );
}
