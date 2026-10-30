import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import BarcodeScanner from '../../components/BarcodeScanner';
import ProductoFacturaAutocompletar from './ProductoFacturaAutocompletar';
import PosTicket from './PosTicket';
import PosHistorial from './PosHistorial';
import PosCuentasPorCobrar from './PosCuentasPorCobrar';
import { useNotificacion } from '../../components/Toast';
import { permisosFacturacion } from '../../utils/permisosFacturacion';
import { impresoraSoportada, imprimirTicketTermico } from '../../utils/escpos';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';

const IVA_FACTOR = 0.12;
const CLIENTE_FINAL = { id: null, nit: 'CF', nombre: 'Consumidor Final', direccion: '' };
const METODOS = [
  { valor: 'efectivo', etiqueta: 'Efectivo', ayuda: 'Pago en efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', ayuda: 'Tarjeta débito o crédito' },
  { valor: 'transferencia', etiqueta: 'Transferencia', ayuda: 'Transferencia bancaria' }
];

function redondear2(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function redondear3(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 1000) / 1000;
}

function fechaLocal() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function IconoVentas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18V9" /><path d="M10 18V5" /><path d="M16 18v-6" /><path d="M22 18H2" />
    </svg>
  );
}

function IconoDinero() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" />
      <path d="M6 9v6M18 9v6" />
    </svg>
  );
}

function IconoTicket() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function IconoCaja() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" />
      <path d="M7 14h4" /><circle cx="17" cy="14" r="1" />
    </svg>
  );
}

export default function CobrosPage() {
  const notificar = useNotificacion();
  const permisos = permisosFacturacion();
  const [contexto, setContexto] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pos');
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(CLIENTE_FINAL);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [referencia, setReferencia] = useState('');
  const [errorVenta, setErrorVenta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ventaConfirmada, setVentaConfirmada] = useState(null);
  const [empresaTicket, setEmpresaTicket] = useState(null);
  const [historialRecarga, setHistorialRecarga] = useState(0);
  const temporizadorBusqueda = useRef(null);

  const caja = contexto?.caja || null;
  const empresa = contexto?.empresa || null;

  const totales = useMemo(() => {
    const descuento = redondear2(carrito.reduce((suma, linea) => suma + Number(linea.descuento || 0), 0));
    const total = redondear2(
      carrito.reduce(
        (suma, linea) => suma + Number(linea.cantidad) * Number(linea.precio_venta) - Number(linea.descuento || 0),
        0
      )
    );
    const subtotal = redondear2(total / (1 + IVA_FACTOR));
    const iva = redondear2(total - subtotal);
    const articulos = redondear3(carrito.reduce((suma, linea) => suma + Number(linea.cantidad), 0));
    return { total: Math.max(0, total), subtotal: Math.max(0, subtotal), iva: Math.max(0, iva), descuento, articulos };
  }, [carrito]);

  const cambio = useMemo(() => {
    if (metodoPago !== 'efectivo') return 0;
    return Math.max(0, redondear2(Number(montoRecibido || 0) - totales.total));
  }, [metodoPago, montoRecibido, totales.total]);

  async function cargarResumen() {
    try {
      const res = await api.get('/pos/resumen', { params: { fecha: fechaLocal() } });
      setResumen(res.data);
    } catch {
      // El resumen es informativo; no bloquea el POS.
    }
  }

  async function cargarContexto(actualizarCliente = false) {
    setCargando(true);
    setError('');
    try {
      const [ctxRes] = await Promise.all([
        api.get('/pos/contexto'),
        cargarResumen()
      ]);
      const ctx = ctxRes.data || {};
      setContexto(ctx);
      setEmpresaTicket((prev) => prev || ctx.empresa || null);
      if (actualizarCliente) {
        const predeterminado = ctx.cliente_predeterminado || CLIENTE_FINAL;
        setCliente({
          id: predeterminado.id || null,
          nit: predeterminado.nit || 'CF',
          nombre: predeterminado.nombre || 'Consumidor Final',
          direccion: predeterminado.direccion || ''
        });
        setClienteEncontrado(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarContexto(true);
  }, []);

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function seleccionarConsumidorFinal() {
    const predeterminado = contexto?.cliente_predeterminado || CLIENTE_FINAL;
    setCliente({
      id: predeterminado.id || null,
      nit: predeterminado.nit || 'CF',
      nombre: predeterminado.nombre || 'Consumidor Final',
      direccion: predeterminado.direccion || ''
    });
    setClienteEncontrado(true);
  }

  function cambiarNit(valor) {
    setCliente((prev) => ({ ...prev, nit: valor.toUpperCase(), id: null }));
    setClienteEncontrado(null);
  }

  async function buscarCliente() {
    const nit = cliente.nit.trim().toUpperCase();
    if (!nit || nit === 'CF') {
      seleccionarConsumidorFinal();
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await api.get('/pos/clientes', { params: { nit } });
      if (res.data) {
        setCliente({
          id: res.data.id,
          nit: res.data.nit,
          nombre: res.data.nombre,
          direccion: res.data.direccion || ''
        });
        setClienteEncontrado(true);
      } else {
        setClienteEncontrado(false);
      }
    } catch {
      setClienteEncontrado(false);
    } finally {
      setBuscandoCliente(false);
    }
  }

  function buscarProductos(texto) {
    setTextoBusqueda(texto);
    clearTimeout(temporizadorBusqueda.current);
    if (texto.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    temporizadorBusqueda.current = setTimeout(async () => {
      setBuscandoProducto(true);
      try {
        const res = await api.get('/pos/productos', { params: { q: texto.trim() } });
        setSugerencias(res.data || []);
      } catch {
        setSugerencias([]);
      } finally {
        setBuscandoProducto(false);
      }
    }, 250);
  }

  function agregarProducto(producto, cantidad = 1) {
    if (!producto) return;
    if (!caja) {
      notificar.error('Abre la caja antes de registrar ventas');
      return;
    }

    const stock = Number(producto.stock_actual || 0);
    if (producto.tipo !== 'servicio' && stock <= 0) {
      notificar.error(`"${producto.nombre}" no tiene existencias`);
      return;
    }

    setCarrito((prev) => {
      const indice = prev.findIndex((linea) => linea.producto_id === producto.id);
      if (indice >= 0) {
        const actual = prev[indice];
        const limite = producto.tipo === 'servicio' ? Infinity : stock;
        const nuevaCantidad = redondear3(Math.min(Number(actual.cantidad) + Number(cantidad), limite));
        if (nuevaCantidad === Number(actual.cantidad)) {
          notificar.error(`No hay más existencias de "${producto.nombre}"`);
          return prev;
        }
        const siguiente = [...prev];
        siguiente[indice] = { ...actual, cantidad: nuevaCantidad };
        return siguiente;
      }

      const limite = producto.tipo === 'servicio' ? Infinity : stock;
      return [
        ...prev,
        {
          producto_id: producto.id,
          codigo: producto.codigo,
          codigo_barras: producto.codigo_barras,
          nombre: producto.nombre,
          presentacion: producto.presentacion,
          unidad_medida: producto.unidad_medida,
          tipo: producto.tipo,
          precio_venta: Number(producto.precio_venta || 0),
          stock,
          cantidad: redondear3(Math.min(Number(cantidad), limite)),
          descuento: 0
        }
      ];
    });

    setTextoBusqueda('');
    setSugerencias([]);
  }

  async function agregarPorCodigo(codigo) {
    const limpio = String(codigo || '').trim();
    if (!limpio) return;
    try {
      const res = await api.get('/pos/productos/codigo', { params: { codigo: limpio } });
      agregarProducto(res.data);
      if (res.data) {
        notificar.exito(`${res.data.nombre} agregado al carrito`);
        setEscanerAbierto(false);
      }
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function enviarBusqueda(evento) {
    evento.preventDefault();
    const texto = textoBusqueda.trim();
    if (!texto) return;
    if (sugerencias.length === 1) {
      agregarProducto(sugerencias[0]);
      return;
    }
    agregarPorCodigo(texto);
  }

  function cambiarCantidad(productoId, valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) {
      notificar.error('La cantidad debe ser mayor a 0');
      return;
    }
    setCarrito((prev) =>
      prev.map((linea) => {
        if (linea.producto_id !== productoId) return linea;
        const limite = linea.tipo === 'servicio' ? Infinity : linea.stock;
        const cantidad = redondear3(Math.min(numero, limite));
        if (numero > limite) {
          notificar.error(`Solo hay ${formatearNumero(linea.stock, 3)} disponibles de "${linea.nombre}"`);
        }
        return { ...linea, cantidad };
      })
    );
  }

  function cambiarDescuento(productoId, valor) {
    const numero = Number(valor);
    setCarrito((prev) =>
      prev.map((linea) => {
        if (linea.producto_id !== productoId) return linea;
        const bruto = redondear2(linea.cantidad * linea.precio_venta);
        return { ...linea, descuento: redondear2(Math.max(0, Math.min(numero || 0, bruto))) };
      })
    );
  }

  function quitarLinea(productoId) {
    setCarrito((prev) => prev.filter((linea) => linea.producto_id !== productoId));
  }

  function vaciarCarrito() {
    setCarrito([]);
    setTextoBusqueda('');
    setSugerencias([]);
  }

  function abrirPago() {
    if (!caja) {
      notificar.error('Abre la caja antes de cobrar');
      return;
    }
    if (carrito.length === 0) {
      notificar.error('Agrega al menos un producto');
      return;
    }
    setMetodoPago('efectivo');
    setMontoRecibido(totales.total.toFixed(2));
    setReferencia('');
    setErrorVenta('');
    setModalPago(true);
  }

  async function confirmarVenta(evento) {
    evento.preventDefault();
    setErrorVenta('');

    if (metodoPago === 'efectivo' && Number(montoRecibido || 0) + 0.001 < totales.total) {
      setErrorVenta('El monto recibido es menor que el total de la venta');
      return;
    }
    if (metodoPago === 'transferencia' && !referencia.trim()) {
      setErrorVenta('La referencia o autorización es obligatoria para transferencias');
      return;
    }
    if (cliente.nit.trim() && cliente.nit.trim().toUpperCase() !== 'CF' && !cliente.nombre.trim()) {
      setErrorVenta('Escribe el nombre del cliente para registrarlo');
      return;
    }

    setEnviando(true);
    try {
      const res = await api.post('/pos/ventas', {
        cliente: {
          id: cliente.id || null,
          nit: cliente.nit.trim() || 'CF',
          nombre: cliente.nombre.trim(),
          direccion: cliente.direccion.trim()
        },
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? Number(montoRecibido) : totales.total,
        referencia: referencia.trim(),
        detalles: carrito.map((linea) => ({
          producto_id: linea.producto_id,
          cantidad: linea.cantidad,
          descuento: linea.descuento
        }))
      });

      setVentaConfirmada(res.data?.venta || null);
      setEmpresaTicket(res.data?.empresa || empresa);
      setModalPago(false);
      vaciarCarrito();
      const predeterminado = contexto?.cliente_predeterminado || CLIENTE_FINAL;
      setCliente({
        id: predeterminado.id || null,
        nit: predeterminado.nit || 'CF',
        nombre: predeterminado.nombre || 'Consumidor Final',
        direccion: predeterminado.direccion || ''
      });
      setClienteEncontrado(true);
      setHistorialRecarga((prev) => prev + 1);
      cargarResumen();
      notificar.exito('Venta registrada correctamente');
    } catch (err) {
      setErrorVenta(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function verVenta(id) {
    try {
      const res = await api.get(`/pos/ventas/${id}`);
      setVentaConfirmada(res.data);
      setEmpresaTicket(empresa);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function nuevaVenta() {
    setVentaConfirmada(null);
    setTab('pos');
  }

  async function imprimirTermico() {
    if (!ventaConfirmada) return;
    try {
      await imprimirTicketTermico(ventaConfirmada, empresaTicket);
      notificar.exito('Ticket enviado a la impresora térmica');
    } catch (err) {
      notificar.error(err.message || 'No se pudo imprimir en la impresora térmica');
    }
  }

  if (cargando) {
    return (
      <section className="pos">
        <div className="pos-cargando">Cargando punto de venta...</div>
      </section>
    );
  }

  return (
    <section className="pos">
      <header className="pos-encabezado">
        <div>
          <h2>POS / Venta</h2>
          <p>Punto de venta, historial y cuentas por cobrar</p>
        </div>
        <div className="pos-encabezado-acciones">
          <span className={`chip ${caja ? 'chip-ok' : 'chip-peligro'}`}>
            {caja ? `Caja #${caja.id} abierta` : 'Caja cerrada'}
          </span>
          {!caja && <Link className="btn btn-secundario btn-mini" to="/caja">Abrir caja</Link>}
        </div>
      </header>

      {error && <div className="alerta alerta-error">{error}</div>}
      {!caja && (
        <div className="alerta alerta-advertencia">
          Para registrar ventas debes abrir la caja del turno. Puedes consultar el historial y las cuentas por cobrar.
        </div>
      )}

      <div className="pos-estadisticas">
        <article className="pos-estadistica">
          <span className="pos-estadistica-icono"><IconoVentas /></span>
          <div>
            <strong>{resumen?.ventas_count ?? 0}</strong>
            <span>Ventas de hoy</span>
          </div>
        </article>
        <article className="pos-estadistica">
          <span className="pos-estadistica-icono"><IconoDinero /></span>
          <div>
            <strong>{formatearMoneda(resumen?.total || 0)}</strong>
            <span>Monto total del día</span>
          </div>
        </article>
        <article className="pos-estadistica">
          <span className="pos-estadistica-icono"><IconoTicket /></span>
          <div>
            <strong>{formatearMoneda(resumen?.ticket_promedio || 0)}</strong>
            <span>Ticket promedio</span>
          </div>
        </article>
        <article className="pos-estadistica">
          <span className="pos-estadistica-icono"><IconoCaja /></span>
          <div>
            <strong>{caja ? `#${caja.id}` : '—'}</strong>
            <span>Caja actual</span>
          </div>
        </article>
      </div>

      <div className="pos-pestanas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pos'}
          className={`pos-pestana${tab === 'pos' ? ' activa' : ''}`}
          onClick={() => setTab('pos')}
        >
          Punto de venta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'historial'}
          className={`pos-pestana${tab === 'historial' ? ' activa' : ''}`}
          onClick={() => setTab('historial')}
        >
          Historial de ventas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cuentas'}
          className={`pos-pestana${tab === 'cuentas' ? ' activa' : ''}`}
          onClick={() => setTab('cuentas')}
        >
          Cuentas por cobrar
        </button>
      </div>

      {tab === 'pos' && (
        <div className="pos-venta">
          <div className="pos-venta-principal">
            <div className="pos-panel pos-buscador">
              <form className="pos-buscador-fila" onSubmit={enviarBusqueda}>
                <div className="pos-buscador-input">
                  <ProductoFacturaAutocompletar
                    valor={textoBusqueda}
                    onBuscar={buscarProductos}
                    sugerencias={sugerencias}
                    onSeleccionar={agregarProducto}
                    onChange={(e) => setTextoBusqueda(e.target.value)}
                    onBlur={() => {}}
                    placeholder="Buscar por código, código de barras o nombre..."
                  />
                </div>
                <button type="submit" className="btn btn-primario" disabled={!caja || buscandoProducto}>
                  Agregar
                </button>
                <button
                  type="button"
                  className="btn btn-secundario pos-boton-escanear"
                  onClick={() => setEscanerAbierto(true)}
                  disabled={!caja}
                >
                  Escanear
                </button>
              </form>
              {buscandoProducto && <p className="pos-ayuda">Buscando productos...</p>}
            </div>

            <div className="pos-panel pos-carrito">
              <div className="pos-panel-cabecera">
                <div>
                  <h3>Carrito</h3>
                  <p>{totales.articulos > 0 ? `${formatearNumero(totales.articulos, 3)} artículo(s)` : 'Sin artículos'}</p>
                </div>
                {carrito.length > 0 && (
                  <button type="button" className="btn btn-secundario btn-mini" onClick={vaciarCarrito}>
                    Vaciar
                  </button>
                )}
              </div>

              <div className="tabla-wrapper pos-carrito-tabla-wrapper">
                <table className="tabla pos-carrito-tabla">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Descuento</th>
                      <th>Subtotal</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="pos-carrito-vacio">
                          Escanea un código o busca un producto para comenzar.
                        </td>
                      </tr>
                    ) : (
                      carrito.map((linea) => (
                        <tr key={linea.producto_id}>
                          <td>
                            <div className="pos-carrito-producto">
                              <strong>{linea.nombre}</strong>
                              <small>
                                {linea.codigo}
                                {linea.presentacion ? ` · ${linea.presentacion}` : ''}
                                {linea.tipo === 'servicio' ? ' · Servicio' : ''}
                              </small>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="control pos-input-cantidad"
                              min="0.001"
                              step={linea.tipo === 'servicio' ? '1' : '0.001'}
                              value={linea.cantidad}
                              onChange={(e) => cambiarCantidad(linea.producto_id, e.target.value)}
                              aria-label={`Cantidad de ${linea.nombre}`}
                            />
                            {linea.tipo !== 'servicio' && (
                              <small className="pos-stock">Stock: {formatearNumero(linea.stock, 3)}</small>
                            )}
                          </td>
                          <td>{formatearMoneda(linea.precio_venta)}</td>
                          <td>
                            <input
                              type="number"
                              className="control pos-input-descuento"
                              min="0"
                              step="0.01"
                              value={linea.descuento}
                              onChange={(e) => cambiarDescuento(linea.producto_id, e.target.value)}
                              aria-label={`Descuento de ${linea.nombre}`}
                            />
                          </td>
                          <td>
                            <strong>
                              {formatearMoneda(linea.cantidad * linea.precio_venta - linea.descuento)}
                            </strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="pos-quitar"
                              onClick={() => quitarLinea(linea.producto_id)}
                              aria-label={`Quitar ${linea.nombre}`}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="pos-venta-lateral">
            <div className="pos-panel pos-cliente">
              <div className="pos-panel-cabecera">
                <div>
                  <h3>Datos del cliente</h3>
                  <p>
                    {buscandoCliente
                      ? 'Buscando...'
                      : clienteEncontrado === false
                        ? 'Se registrará al cobrar'
                        : clienteEncontrado === true
                          ? 'Cliente registrado'
                          : 'Consumidor Final'}
                  </p>
                </div>
                <button type="button" className="btn btn-secundario btn-mini" onClick={seleccionarConsumidorFinal}>
                  CF
                </button>
              </div>

              <label className="campo">
                <span>NIT / DPI</span>
                <input
                  type="text"
                  className="control"
                  maxLength={20}
                  value={cliente.nit}
                  onChange={(e) => cambiarNit(e.target.value)}
                  onBlur={buscarCliente}
                  placeholder="CF"
                />
              </label>

              <label className="campo">
                <span>Nombre</span>
                <input
                  type="text"
                  className="control"
                  maxLength={150}
                  value={cliente.nombre}
                  onChange={(e) => setCliente((prev) => ({ ...prev, nombre: e.target.value }))}
                  disabled={cliente.nit.trim().toUpperCase() === 'CF'}
                  placeholder="Nombre del cliente"
                />
              </label>

              <label className="campo">
                <span>Dirección</span>
                <input
                  type="text"
                  className="control"
                  maxLength={255}
                  value={cliente.direccion}
                  onChange={(e) => setCliente((prev) => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección (opcional)"
                />
              </label>
            </div>

            <div className="pos-panel pos-totales">
              <h3>Resumen de cobro</h3>
              <div className="pos-total-linea">
                <span>Artículos</span>
                <strong>{formatearNumero(totales.articulos, 3)}</strong>
              </div>
              <div className="pos-total-linea">
                <span>Subtotal</span>
                <strong>{formatearMoneda(totales.subtotal)}</strong>
              </div>
              <div className="pos-total-linea">
                <span>IVA 12% (incluido)</span>
                <strong>{formatearMoneda(totales.iva)}</strong>
              </div>
              {totales.descuento > 0 && (
                <div className="pos-total-linea">
                  <span>Descuento</span>
                  <strong>-{formatearMoneda(totales.descuento)}</strong>
                </div>
              )}
              <div className="pos-total-general">
                <span>Total a cobrar</span>
                <strong>{formatearMoneda(totales.total)}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primario pos-boton-cobrar"
                onClick={abrirPago}
                disabled={!caja || carrito.length === 0 || totales.total <= 0}
              >
                Cobrar
              </button>
            </div>
          </aside>
        </div>
      )}

      {tab === 'historial' && (
        <PosHistorial
          recargar={historialRecarga}
          onVer={verVenta}
          onCambio={() => {
            setHistorialRecarga((prev) => prev + 1);
            cargarResumen();
          }}
          puedeAnular={permisos.anularCobros}
          puedeDevolver={permisos.registrarDevoluciones}
        />
      )}

      {tab === 'cuentas' && <PosCuentasPorCobrar />}

      <Modal
        abierto={escanerAbierto}
        titulo="Escanear código"
        onCerrar={() => setEscanerAbierto(false)}
        ancho="460px"
      >
        <BarcodeScanner onDetectar={agregarPorCodigo} deshabilitado={!caja} />
      </Modal>

      <Modal
        abierto={modalPago}
        titulo="Cobrar venta"
        onCerrar={() => !enviando && setModalPago(false)}
        ancho="520px"
      >
        <form className="pos-pago" onSubmit={confirmarVenta}>
          <div className="pos-pago-total">
            <span>Total a cobrar</span>
            <strong>{formatearMoneda(totales.total)}</strong>
            <small>{formatearNumero(totales.articulos, 3)} artículo(s)</small>
          </div>

          {errorVenta && <div className="alerta alerta-error">{errorVenta}</div>}

          <div className="pos-metodos">
            {METODOS.map((metodo) => (
              <button
                key={metodo.valor}
                type="button"
                className={`pos-metodo${metodoPago === metodo.valor ? ' activo' : ''}`}
                onClick={() => {
                  setMetodoPago(metodo.valor);
                  setMontoRecibido(metodo.valor === 'efectivo' ? totales.total.toFixed(2) : totales.total.toFixed(2));
                  setErrorVenta('');
                }}
              >
                <strong>{metodo.etiqueta}</strong>
                <span>{metodo.ayuda}</span>
              </button>
            ))}
          </div>

          {metodoPago === 'efectivo' ? (
            <>
              <label className="campo">
                <span>Monto recibido *</span>
                <input
                  type="number"
                  className="control pos-input-recibido"
                  min="0"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  required
                />
              </label>
              <div className="pos-pago-rapido">
                <button type="button" className="btn btn-secundario btn-mini" onClick={() => setMontoRecibido(totales.total.toFixed(2))}>
                  Exacto
                </button>
                {[50, 100, 200, 500].filter((monto) => monto > totales.total).map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    className="btn btn-secundario btn-mini"
                    onClick={() => setMontoRecibido(monto.toFixed(2))}
                  >
                    Q{monto}
                  </button>
                ))}
              </div>
              <div className="pos-pago-cambio">
                <span>Cambio</span>
                <strong>{formatearMoneda(cambio)}</strong>
              </div>
            </>
          ) : (
            <label className="campo">
              <span>
                Referencia / autorización {metodoPago === 'transferencia' ? '*' : '(opcional)'}
              </span>
              <input
                type="text"
                className="control"
                maxLength={100}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder={metodoPago === 'transferencia' ? 'Número de boleta o autorización' : 'Últimos dígitos o autorización'}
                required={metodoPago === 'transferencia'}
              />
            </label>
          )}

          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setModalPago(false)} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Confirmar cobro'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={Boolean(ventaConfirmada)}
        titulo={ventaConfirmada?.estado === 'anulada' ? 'Ticket anulado' : 'Ticket de venta'}
        onCerrar={() => setVentaConfirmada(null)}
        ancho="430px"
      >
        <div className="pos-ticket-contenedor">
          <PosTicket venta={ventaConfirmada} empresa={empresaTicket} />
        </div>
        <div className="modal-acciones pos-ticket-acciones">
          <button type="button" className="btn btn-secundario" onClick={nuevaVenta}>
            Nueva venta
          </button>
          {impresoraSoportada() && (
            <button type="button" className="btn btn-secundario" onClick={imprimirTermico}>
              Imprimir térmica
            </button>
          )}
          <button type="button" className="btn btn-primario" onClick={() => window.print()}>
            Imprimir ticket
          </button>
        </div>
      </Modal>
    </section>
  );
}
