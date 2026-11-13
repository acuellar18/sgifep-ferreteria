import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import FiltrosCompras from '../../components/FiltrosCompras';
import ConfirmDialog from '../../components/ConfirmDialog';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { permisosCompras } from '../../utils/permisosCompras';
import {
  etiquetaEstado,
  etiquetaEstadoPago,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  formatearNumero
} from '../../utils/formatos';
import EditarFacturaModal from './EditarFacturaModal';
import ConfiguracionEmpresaModal from './ConfiguracionEmpresaModal';
import FlujoCompras from './FlujoCompras';

const FILTROS_INICIALES = {
  q: '',
  proveedor: '',
  estado_pago: '',
  estado: '',
  startDate: '',
  endDate: ''
};

const PAGE_SIZE = 10;

function rutaImpresionFactura(id) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/compras/facturas/${id}/imprimir`;
}

function rutaImpresionLista(filtros) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== 'todos' && valor != null) params.set(clave, valor);
  }
  const query = params.toString();
  return `${base}/compras/facturas/imprimir${query ? `?${query}` : ''}`;
}

function ChipEstadoPago({ estado }) {
  const clase = estado === 'pagada' ? 'chip-ok' : estado === 'parcial' ? 'chip-rol' : 'chip-peligro';
  return <span className={`chip ${clase}`}>{etiquetaEstadoPago(estado)}</span>;
}

function ChipEstado({ estado }) {
  return (
    <span className={`chip ${estado === 'anulada' ? 'chip-peligro' : 'chip-ok'}`}>
      {etiquetaEstado(estado)}
    </span>
  );
}

export default function ComprasPage() {
  const notificar = useNotificacion();

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'fecha', sortDir: 'desc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumenes, setResumenes] = useState({ total_por_pagar: 0, total_vencido: 0, vence_7_dias: 0 });
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalleCompra, setDetalleCompra] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [guardandoComentario, setGuardandoComentario] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [editandoCompra, setEditandoCompra] = useState(null);
  const [configAbierta, setConfigAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(null);
  const [pagoCompra, setPagoCompra] = useState(null);
  const [pagoForm, setPagoForm] = useState({ fecha: '', monto: '', metodo: 'efectivo', referencia: '', notas: '' });
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [pagoAnular, setPagoAnular] = useState(null);
  const [motivoAnulacionPago, setMotivoAnulacionPago] = useState('');
  const [anulandoPago, setAnulandoPago] = useState(false);
  const temporizadorBusqueda = useRef(null);
  const inputArchivoRef = useRef(null);

  const sesion = JSON.parse(localStorage.getItem('session') || '{}');
  const permisos = permisosCompras(sesion);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '' && valor !== 'todos');

  const cargarCompras = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/compras', { params });
      setCompras(res.data);
      const nuevoTotal = res.total ?? res.data.length;
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      setCompras([]);
      setTotal(0);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarResumenes = useCallback(async () => {
    try {
      const res = await api.get('/compras/resumenes');
      setResumenes(res.data);
    } catch (err) {
      console.error('Error cargando resúmenes:', err);
    }
  }, []);

  const cargarProveedores = useCallback(async () => {
    try {
      const res = await api.get('/proveedores/resumen?estado=activo');
      setProveedores(res.data);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    }
  }, []);

  useEffect(() => {
    cargarProveedores();
    cargarResumenes();
    cargarCompras(filtros, pagina, orden);
  }, [pagina, orden]);

  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => {
        setPagina(1);
        cargarCompras(nuevos, 1, orden);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    setPagina(1);
    cargarCompras(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    cargarCompras(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  async function cargarDetalle(compraId, abrirModal = true) {
    const [resDetalle, resComentarios, resArchivos] = await Promise.all([
      api.get(`/compras/${compraId}`),
      api.get(`/compras/${compraId}/comentarios`),
      api.get(`/compras/${compraId}/archivos`)
    ]);
    setDetalleCompra(resDetalle.data);
    setComentarios(resComentarios.data || []);
    setArchivos(resArchivos.data || []);
    if (abrirModal) setDetalleAbierto(true);
  }

  async function verDetalle(compra) {
    try {
      await cargarDetalle(compra.id);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function solicitarAnulacion(compra) {
    setConfirmando({ ...compra, accion: 'anular', motivo: '' });
  }

  async function ejecutarAnulacion() {
    const target = confirmando;
    if (!target) return;
    if (!target.motivo?.trim()) {
      notificar.error('Ingrese el motivo de anulación');
      return;
    }
    setError('');
    try {
      await api.post(`/compras/${target.id}/anular`, { motivo: target.motivo });
      notificar.exito('Compra anulada correctamente');
      setConfirmando(null);
      setDetalleAbierto(false);
      setDetalleCompra(null);
      await cargarCompras(filtros, pagina, orden);
      await cargarResumenes();
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  function abrirPago(compra) {
    setPagoCompra(compra);
    setPagoForm({
      fecha: new Date().toISOString().slice(0, 10),
      monto: Number(compra.saldo_pendiente || 0).toFixed(2),
      metodo: 'efectivo',
      referencia: '',
      notas: ''
    });
  }

  async function registrarPago(e) {
    e.preventDefault();
    if (!pagoCompra) return;
    setGuardandoPago(true);
    try {
      await api.post(`/compras/${pagoCompra.id}/pagos`, {
        fecha: pagoForm.fecha,
        monto: Number(pagoForm.monto),
        metodo: pagoForm.metodo,
        referencia: pagoForm.referencia,
        notas: pagoForm.notas
      });
      notificar.exito('Pago registrado correctamente');
      const idDetalle = detalleCompra?.id;
      setPagoCompra(null);
      await cargarCompras(filtros, pagina, orden);
      await cargarResumenes();
      if (idDetalle) await cargarDetalle(idDetalle, false);
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardandoPago(false);
    }
  }

  async function anularPago(e) {
    e.preventDefault();
    if (!pagoAnular || !detalleCompra) return;
    setAnulandoPago(true);
    try {
      await api.delete(`/compras/${detalleCompra.id}/pagos/${pagoAnular.id}`, {
        data: { motivo: motivoAnulacionPago }
      });
      notificar.exito('Pago anulado correctamente');
      setPagoAnular(null);
      setMotivoAnulacionPago('');
      await cargarDetalle(detalleCompra.id, false);
      await cargarCompras(filtros, pagina, orden);
      await cargarResumenes();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setAnulandoPago(false);
    }
  }

  async function agregarComentario(e) {
    e.preventDefault();
    if (!detalleCompra || !comentarioNuevo.trim()) return;
    setGuardandoComentario(true);
    try {
      await api.post(`/compras/${detalleCompra.id}/comentarios`, {
        comentario: comentarioNuevo.trim()
      });
      setComentarioNuevo('');
      const res = await api.get(`/compras/${detalleCompra.id}/comentarios`);
      setComentarios(res.data || []);
      notificar.exito('Comentario agregado');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardandoComentario(false);
    }
  }

  async function subirArchivo(e) {
    e.preventDefault();
    const archivo = inputArchivoRef.current?.files?.[0];
    if (!detalleCompra || !archivo) {
      notificar.error('Seleccione un archivo PDF, JPG o PNG');
      return;
    }
    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      await api.post(`/compras/${detalleCompra.id}/archivos`, formData);
      inputArchivoRef.current.value = '';
      const res = await api.get(`/compras/${detalleCompra.id}/archivos`);
      setArchivos(res.data || []);
      notificar.exito('Archivo adjuntado correctamente');
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function descargarArchivo(archivo) {
    if (!detalleCompra) return;
    try {
      const blob = await api.get(
        `/compras/${detalleCompra.id}/archivos/${archivo.id}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = archivo.nombre_original;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  async function eliminarArchivo(archivo) {
    if (!detalleCompra) return;
    if (!window.confirm(`¿Eliminar el archivo "${archivo.nombre_original}"?`)) return;
    try {
      await api.delete(`/compras/${detalleCompra.id}/archivos/${archivo.id}`);
      setArchivos((prev) => prev.filter((a) => a.id !== archivo.id));
      notificar.exito('Archivo eliminado');
    } catch (err) {
      notificar.error(err.message);
    }
  }

  async function alEditar(mensaje) {
    setEditandoCompra(null);
    notificar.exito(mensaje || 'Factura actualizada correctamente');
    await cargarCompras(filtros, pagina, orden);
    await cargarResumenes();
    if (detalleCompra) await cargarDetalle(detalleCompra.id, false);
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h2>Facturas y pagos</h2>
          <p className="reporte-detalle">
            Paso 3: revisa las facturas generadas por tus compras, sus saldos y pagos.
          </p>
        </div>
        <div className="acciones-encabezado">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => window.open(rutaImpresionLista(filtros), '_blank')}
          >
            Imprimir listado
          </button>
          {permisos.configurarEmpresa && (
            <button type="button" className="btn btn-secundario" onClick={() => setConfigAbierta(true)}>
              Datos de la empresa
            </button>
          )}
          {permisos.crearCompra && (
            <Link to="/compras/facturas/nueva" className="btn btn-primario">
              + Registrar compra
            </Link>
          )}
        </div>
      </div>

      <FlujoCompras pasoActivo={3} />

      <div className="tarjetas">
        <div className="tarjeta">
          <span className="tarjeta-valor">{formatearMoneda(resumenes.total_por_pagar)}</span>
          <span className="tarjeta-etiqueta">Total por pagar</span>
        </div>
        <div className="tarjeta tarjeta-peligro">
          <span className="tarjeta-valor">{formatearMoneda(resumenes.total_vencido)}</span>
          <span className="tarjeta-etiqueta">Vencido</span>
        </div>
        <div className="tarjeta tarjeta-alerta">
          <span className="tarjeta-valor">{formatearMoneda(resumenes.vence_7_dias)}</span>
          <span className="tarjeta-etiqueta">Vence en 7 días</span>
        </div>
      </div>

      <FiltrosCompras
        filtros={filtros}
        onChange={cambiarFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      >
        <select
          className="control"
          value={filtros.proveedor}
          onChange={(e) => cambiarFiltros({ ...filtros, proveedor: e.target.value })}
        >
          <option value="">Proveedor: todos</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <select
          className="control"
          value={filtros.estado_pago}
          onChange={(e) => cambiarFiltros({ ...filtros, estado_pago: e.target.value })}
        >
          <option value="">Pago: todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="pagada">Pagada</option>
        </select>
        <select
          className="control"
          value={filtros.estado}
          onChange={(e) => cambiarFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Estado: todos</option>
          <option value="recibida">Recibida</option>
          <option value="anulada">Anulada</option>
        </select>
        <input
          type="date"
          className="control"
          title="Desde"
          value={filtros.startDate}
          onChange={(e) => cambiarFiltros({ ...filtros, startDate: e.target.value })}
        />
        <input
          type="date"
          className="control"
          title="Hasta"
          value={filtros.endDate}
          onChange={(e) => cambiarFiltros({ ...filtros, endDate: e.target.value })}
        />
      </FiltrosCompras>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando compras...</p>
      ) : compras.length === 0 ? (
        <div className="estado-vacio">
          <h3>
            {hayFiltros
              ? 'No se encontraron compras'
              : proveedores.length === 0
                ? 'Primero registra un proveedor'
                : 'Aún no hay compras registradas'}
          </h3>
          <p>
            {hayFiltros
              ? 'Prueba con otros filtros o limpia la búsqueda.'
              : proveedores.length === 0
                ? 'Las compras se registran a nombre de un proveedor. Crea el primero para continuar.'
                : 'Registra la primera compra para que aparezca aquí con su factura y saldo por pagar.'}
          </p>
          <div className="estado-vacio-acciones">
            {hayFiltros ? (
              <button type="button" className="btn btn-secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            ) : proveedores.length === 0 ? (
              <Link to="/compras/proveedores" className="btn btn-primario">
                Registrar proveedor
              </Link>
            ) : permisos.crearCompra ? (
              <Link to="/compras/facturas/nueva" className="btn btn-primario">
                + Registrar primera compra
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="numero" ordenActual={orden} onOrdenar={cambiarOrden}>N° compra</ThOrdenable>
                  <ThOrdenable columna="fecha" ordenActual={orden} onOrdenar={cambiarOrden}>Fecha</ThOrdenable>
                  <ThOrdenable columna="proveedor_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Proveedor</ThOrdenable>
                  <ThOrdenable columna="numero_factura" ordenActual={orden} onOrdenar={cambiarOrden}>Factura</ThOrdenable>
                  <ThOrdenable columna="total" ordenActual={orden} onOrdenar={cambiarOrden}>Total</ThOrdenable>
                  <th>Saldo</th>
                  <th>Estado pago</th>
                  <th>Estado</th>
                  <th className="tabla-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td>{c.numero}</td>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>{c.proveedor_nombre}</td>
                    <td>{[c.serie, c.numero_factura].filter(Boolean).join('-') || '—'}</td>
                    <td>{formatearMoneda(c.total)}</td>
                    <td>{formatearMoneda(c.saldo_pendiente)}</td>
                    <td><ChipEstadoPago estado={c.estado_pago} /></td>
                    <td><ChipEstado estado={c.estado} /></td>
                    <td className="tabla-acciones">
                      <div className="acciones-fila">
                        <button
                          type="button"
                          className="btn btn-opcion"
                          title="Ver detalle de la factura"
                          onClick={() => verDetalle(c)}
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className="btn btn-opcion"
                          title="Imprimir factura"
                          onClick={() => window.open(rutaImpresionFactura(c.id), '_blank')}
                        >
                          Imprimir
                        </button>
                        {c.estado === 'recibida' && permisos.crearCompra && (
                          <button
                            type="button"
                            className="btn btn-opcion"
                            title="Editar factura"
                            onClick={() => setEditandoCompra(c)}
                          >
                            Editar
                          </button>
                        )}
                        {c.estado_pago !== 'pagada' && c.estado === 'recibida' && permisos.registrarPago && (
                          <button
                            type="button"
                            className="btn btn-opcion"
                            title="Registrar pago"
                            onClick={() => abrirPago(c)}
                          >
                            Pagar
                          </button>
                        )}
                        {c.estado === 'recibida' && permisos.anularCompra && (
                          <button
                            type="button"
                            className="btn btn-opcion btn-danger"
                            title="Anular factura"
                            onClick={() => solicitarAnulacion(c)}
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={total} onCambiar={setPagina} />
        </>
      )}

      <Modal
        abierto={detalleAbierto}
        titulo={`Detalle de compra: ${detalleCompra?.numero || ''}`}
        onCerrar={() => { setDetalleAbierto(false); setDetalleCompra(null); }}
        ancho="980px"
      >
        {detalleCompra && (
          <div>
            <div className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="campo"><span>N° compra</span> <strong>{detalleCompra.numero}</strong></div>
              <div className="campo"><span>Fecha</span> <strong>{formatearFecha(detalleCompra.fecha)}</strong></div>
              <div className="campo"><span>Proveedor</span> <strong>{detalleCompra.proveedor_nombre}</strong></div>
              <div className="campo"><span>Factura</span> <strong>{[detalleCompra.serie, detalleCompra.numero_factura].filter(Boolean).join('-') || '—'}</strong></div>
              <div className="campo"><span>Condición</span> <strong>{detalleCompra.condicion === 'credito' ? 'Crédito' : 'Contado'}</strong></div>
              <div className="campo"><span>Fecha venc.</span> <strong>{formatearFecha(detalleCompra.fecha_vencimiento)}</strong></div>
              <div className="campo"><span>Registrado por</span> <strong>{detalleCompra.usuario_nombre || '—'}</strong></div>
              <div className="campo"><span>Estado</span> <strong><ChipEstado estado={detalleCompra.estado} /></strong></div>
              <div className="campo"><span>Estado pago</span> <strong><ChipEstadoPago estado={detalleCompra.estado_pago} /></strong></div>
            </div>

            <h4 style={{ margin: '16px 0 8px' }}>Productos</h4>
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Costo unit.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleCompra.detalles?.map((d) => (
                    <tr key={d.id}>
                      <td>{d.producto_codigo}</td>
                      <td>{d.producto_nombre}</td>
                      <td style={{ textAlign: 'right' }}>{formatearNumero(d.cantidad, 2)} {d.unidad_medida}</td>
                      <td style={{ textAlign: 'right' }}>{formatearMoneda(d.costo_unitario)}</td>
                      <td style={{ textAlign: 'right' }}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="campo"><span>Subtotal</span> <strong>{formatearMoneda(detalleCompra.subtotal)}</strong></div>
              <div className="campo"><span>IVA (12%)</span> <strong>{formatearMoneda(detalleCompra.iva)}</strong></div>
              <div className="campo"><span>Total</span> <strong style={{ fontSize: '18px' }}>{formatearMoneda(detalleCompra.total)}</strong></div>
              <div className="campo"><span>Pagado</span> <strong>{formatearMoneda(detalleCompra.monto_pagado)}</strong></div>
              <div className="campo"><span>Saldo pendiente</span> <strong style={{ color: detalleCompra.saldo_pendiente > 0 ? 'var(--color-peligro)' : 'var(--color-primario)' }}>{formatearMoneda(detalleCompra.saldo_pendiente)}</strong></div>
            </div>

            {detalleCompra.pagos?.length > 0 && (
              <>
                <h4 style={{ margin: '16px 0 8px' }}>Historial de pagos</h4>
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Estado</th>
                        <th>Registrado por</th>
                        <th className="tabla-acciones">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleCompra.pagos.map((p) => (
                        <tr key={p.id}>
                          <td>{formatearFecha(p.fecha)}</td>
                          <td>{formatearMoneda(p.monto)}</td>
                          <td>{p.metodo}</td>
                          <td>{p.referencia || '—'}</td>
                          <td>
                            <span className={`chip ${p.estado === 'anulado' ? 'chip-peligro' : 'chip-ok'}`}>
                              {p.estado === 'anulado' ? 'Anulado' : 'Activo'}
                            </span>
                          </td>
                          <td>{p.usuario_nombre || '—'}</td>
                          <td className="tabla-acciones">
                            {p.estado === 'activo' && permisos.anularPago && detalleCompra.estado !== 'anulada' ? (
                              <button
                                type="button"
                                className="btn btn-opcion btn-danger"
                                title="Anular pago"
                                onClick={() => { setPagoAnular(p); setMotivoAnulacionPago(''); }}
                              >
                                Anular
                              </button>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {detalleCompra.notas && (
              <p className="reporte-detalle" style={{ marginTop: '16px' }}>
                <strong>Notas:</strong> {detalleCompra.notas}
              </p>
            )}

            <div className="comentarios-archivos">
              <div>
                <h4>Comentarios</h4>
                {comentarios.length === 0 ? (
                  <p className="estado">Sin comentarios.</p>
                ) : (
                  <ul className="lista-comentarios">
                    {comentarios.map((c) => (
                      <li key={c.id}>
                        <p>{c.comentario}</p>
                        <span>{c.usuario_nombre || 'Usuario'} · {formatearFechaHora(c.creado_en)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {permisos.crearCompra && (
                  <form className="form-comentario" onSubmit={agregarComentario}>
                    <textarea
                      className="control"
                      rows={2}
                      placeholder="Agregar una observación..."
                      value={comentarioNuevo}
                      onChange={(e) => setComentarioNuevo(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secundario" disabled={guardandoComentario || !comentarioNuevo.trim()}>
                      {guardandoComentario ? 'Guardando...' : 'Agregar comentario'}
                    </button>
                  </form>
                )}
              </div>

              <div>
                <h4>Archivos adjuntos</h4>
                {archivos.length === 0 ? (
                  <p className="estado">Sin archivos adjuntos.</p>
                ) : (
                  <ul className="lista-archivos">
                    {archivos.map((a) => (
                      <li key={a.id}>
                        <button type="button" className="enlace-archivo" onClick={() => descargarArchivo(a)}>
                          {a.nombre_original}
                        </button>
                        <span>{(a.tamano / 1024).toFixed(0)} KB · {formatearFechaHora(a.creado_en)}</span>
                        {permisos.crearCompra && (
                          <button type="button" className="btn btn-opcion btn-danger" onClick={() => eliminarArchivo(a)}>
                            Eliminar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {permisos.crearCompra && detalleCompra.estado === 'recibida' && (
                  <form className="form-archivo" onSubmit={subirArchivo}>
                    <input ref={inputArchivoRef} type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    <button type="submit" className="btn btn-secundario" disabled={subiendoArchivo}>
                      {subiendoArchivo ? 'Subiendo...' : 'Adjuntar archivo'}
                    </button>
                    <small>PDF, JPG o PNG. Máximo 5 MB.</small>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <EditarFacturaModal
        abierto={Boolean(editandoCompra)}
        compra={editandoCompra}
        onCerrar={() => setEditandoCompra(null)}
        onGuardado={() => alEditar()}
      />

      <ConfiguracionEmpresaModal
        abierto={configAbierta}
        onCerrar={() => setConfigAbierta(false)}
      />

      <Modal
        abierto={Boolean(pagoCompra)}
        titulo={`Registrar pago: ${pagoCompra?.numero || ''}`}
        onCerrar={() => setPagoCompra(null)}
        ancho="520px"
      >
        {pagoCompra && (
          <form onSubmit={registrarPago}>
            <div className="form-grid">
              <label className="campo">
                <span>Fecha *</span>
                <input
                  type="date"
                  className="control"
                  required
                  value={pagoForm.fecha}
                  onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })}
                />
              </label>
              <label className="campo">
                <span>Monto *</span>
                <input
                  type="number"
                  className="control"
                  step="0.01"
                  min="0.01"
                  max={Number(pagoCompra.saldo_pendiente || 0)}
                  required
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                />
              </label>
              <label className="campo">
                <span>Método *</span>
                <select
                  className="control"
                  value={pagoForm.metodo}
                  onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="campo">
                <span>Referencia</span>
                <input
                  type="text"
                  className="control"
                  value={pagoForm.referencia}
                  onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                />
              </label>
            </div>
            <p className="reporte-detalle" style={{ marginTop: '8px' }}>
              Saldo pendiente: <strong>{formatearMoneda(pagoCompra.saldo_pendiente)}</strong>
            </p>
            <label className="campo">
              <span>Notas</span>
              <textarea
                className="control"
                rows={2}
                value={pagoForm.notas}
                onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
              />
            </label>
            <div className="modal-acciones">
              <button type="button" className="btn btn-secundario" onClick={() => setPagoCompra(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primario" disabled={guardandoPago}>
                {guardandoPago ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        abierto={Boolean(pagoAnular)}
        titulo="Anular pago"
        onCerrar={() => setPagoAnular(null)}
        ancho="460px"
      >
        {pagoAnular && (
          <form onSubmit={anularPago}>
            <p className="confirmar-mensaje">
              Se anulará el pago de <strong>{formatearMoneda(pagoAnular.monto)}</strong> del{' '}
              {formatearFecha(pagoAnular.fecha)}. El monto volverá al saldo pendiente de la compra.
            </p>
            <label className="campo">
              <span>Motivo *</span>
              <textarea
                className="control"
                rows={3}
                required
                value={motivoAnulacionPago}
                onChange={(e) => setMotivoAnulacionPago(e.target.value)}
              />
            </label>
            <div className="modal-acciones">
              <button type="button" className="btn btn-secundario" onClick={() => setPagoAnular(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger" disabled={anulandoPago}>
                {anulandoPago ? 'Anulando...' : 'Anular pago'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        abierto={Boolean(confirmando?.accion === 'anular')}
        titulo="Anular compra"
        mensaje={
          <>
            <p>¿Seguro que desea anular la compra <strong>{confirmando?.numero}</strong>?</p>
            <p>Esta acción revertirá el stock de los productos y no se puede deshacer.</p>
            <label className="campo" style={{ marginTop: '12px' }}>
              <span>Motivo *</span>
              <textarea
                className="control"
                rows={3}
                required
                value={confirmando?.motivo || ''}
                onChange={(e) => setConfirmando({ ...confirmando, motivo: e.target.value })}
                placeholder="Ingrese el motivo de anulación..."
              />
            </label>
          </>
        }
        confirmarTexto="Anular compra"
        onConfirmar={ejecutarAnulacion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}
