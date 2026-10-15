import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';

const FILTROS_INICIALES = {
  q: '',
  proveedor: '',
  estado_pago: '',
  estado: '',
  startDate: '',
  endDate: ''
};

const PAGE_SIZE = 10;

export default function ComprasPage() {
  const navigate = useNavigate();
  const notificar = useNotificacion();

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'fecha', sortDir: 'desc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumenes, setResumenes] = useState({ comprado_mes: 0, total_por_pagar: 0, compras_semana: 0 });
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalleCompra, setDetalleCompra] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const temporizadorBusqueda = useRef(null);

  const sesion = JSON.parse(localStorage.getItem('session') || '{}');
  const esAdmin = sesion.superadmin || sesion.roles?.includes('administrador');

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  async function verDetalle(compra) {
    try {
      const res = await api.get(`/compras/${compra.id}`);
      setDetalleCompra(res.data);
      setDetalleAbierto(true);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  async function confirmarAnular(compra) {
    setConfirmando({ ...compra, accion: 'anular' });
  }

  async function ejecutarAnulacion() {
    const target = confirmando;
    if (!target) return;
    setError('');
    try {
      await api.post(`/compras/${target.id}/anular`, { motivo: target.motivo });
      notificar.exito('Compra anulada correctamente');
      setConfirmando(null);
      await cargarCompras(filtros, pagina, orden);
      await cargarResumenes();
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-GT');
  }

  function formatearMoneda(valor) {
    if (valor === null || valor === undefined) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(valor);
  }

  function chipEstadoPago(estado) {
    const clases = {
      pagada: 'chip-ok',
      parcial: 'chip-rol',
      pendiente: 'chip-peligro'
    };
    const etiquetas = {
      pagada: 'Pagada',
      parcial: 'Parcial',
      pendiente: 'Pendiente'
    };
    return <span className={`chip ${clases[estado] || 'chip'}`}>{etiquetas[estado] || estado}</span>;
  }

  function chipEstado(estado) {
    return (
      <span className={`chip ${estado === 'anulada' ? 'chip-peligro' : 'chip-ok'}`}>
        {estado}
      </span>
    );
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Listado de Compras</h2>
        <div className="acciones-encabezado">
          {esAdmin && (
            <button type="button" className="btn btn-primario" onClick={() => navigate('/compras/nueva')}>
              + Nueva Compra
            </button>
          )}
        </div>
      </div>

      <div className="tarjetas">
        <div className="tarjeta">
          <span className="tarjeta-valor">{formatearMoneda(resumenes.comprado_mes)}</span>
          <span className="tarjeta-etiqueta">Comprado este mes</span>
        </div>
        <div className="tarjeta tarjeta-peligro">
          <span className="tarjeta-valor">{formatearMoneda(resumenes.total_por_pagar)}</span>
          <span className="tarjeta-etiqueta">Total por pagar</span>
        </div>
        <div className="tarjeta">
          <span className="tarjeta-valor">{resumenes.compras_semana}</span>
          <span className="tarjeta-etiqueta">Compras esta semana</span>
        </div>
      </div>

      <FilterBar
        filtros={filtros}
        departamentos={[]}
        roles={[]}
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
          {proveedores.map(p => (
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
      </FilterBar>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando compras...</p>
      ) : compras.length === 0 ? (
        <p className="estado">No se encontraron compras con los filtros aplicados.</p>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="numero" ordenActual={orden} onOrdenar={cambiarOrden}>N° compra</ThOrdenable>
                  <ThOrdenable columna="fecha" ordenActual={orden} onOrdenar={cambiarOrden}>Fecha</ThOrdenable>
                  <ThOrdenable columna="proveedor_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Proveedor</ThOrdenable>
                  <ThOrdenable columna="numero_factura" ordenActual={orden} onOrdenar={cambiarOrden}>N° factura</ThOrdenable>
                  <ThOrdenable columna="total" ordenActual={orden} onOrdenar={cambiarOrden}>Total</ThOrdenable>
                  <th>Estado pago</th>
                  <th>Estado</th>
                  <ThOrdenable columna="creado_en" ordenActual={orden} onOrdenar={cambiarOrden}>Registrado</ThOrdenable>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td>{c.numero}</td>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>{c.proveedor_nombre}</td>
                    <td>{c.numero_factura || '—'}</td>
                    <td>{formatearMoneda(c.total)}</td>
                    <td>{chipEstadoPago(c.estado_pago)}</td>
                    <td>{chipEstado(c.estado)}</td>
                    <td>{formatearFecha(c.creado_en)}</td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn btn-opcion" onClick={() => verDetalle(c)}>
                          Ver detalle
                        </button>
                        <button type="button" className="btn btn-opcion" onClick={() => window.print()}>
                          Imprimir
                        </button>
                        {c.estado_pago !== 'pagada' && c.estado === 'recibida' && esAdmin && (
                          <button
                            type="button"
                            className="btn btn-opcion"
                            onClick={() => navigate(`/compras/${c.id}/pagar`)}
                          >
                            Registrar pago
                          </button>
                        )}
                        {c.estado === 'recibida' && esAdmin && (
                          <button
                            type="button"
                            className="btn btn-opcion btn-danger"
                            onClick={() => confirmarAnular(c)}
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
        ancho="900px"
      >
        {detalleCompra && (
          <div>
            <div className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="campo"><span>N° compra</span> <strong>{detalleCompra.numero}</strong></div>
              <div className="campo"><span>Fecha</span> <strong>{formatearFecha(detalleCompra.fecha)}</strong></div>
              <div className="campo"><span>Proveedor</span> <strong>{detalleCompra.proveedor_nombre}</strong></div>
              <div className="campo"><span>N° factura</span> <strong>{detalleCompra.numero_factura || '—'}</strong></div>
              <div className="campo"><span>Condición</span> <strong>{detalleCompra.condicion}</strong></div>
              <div className="campo"><span>Fecha venc.</span> <strong>{formatearFecha(detalleCompra.fecha_vencimiento) || '—'}</strong></div>
              <div className="campo"><span>Registrado por</span> <strong>{detalleCompra.usuario_nombre || '—'}</strong></div>
              <div className="campo"><span>Estado</span> <strong>{chipEstado(detalleCompra.estado)}</strong></div>
              <div className="campo"><span>Estado pago</span> <strong>{chipEstadoPago(detalleCompra.estado_pago)}</strong></div>
            </div>

            <h4 style={{ margin: '16px 0 8px' }}>Productos</h4>
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th style={{textAlign:'right'}}>Cantidad</th>
                    <th style={{textAlign:'right'}}>Costo unit.</th>
                    <th style={{textAlign:'right'}}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleCompra.detalles?.map(d => (
                    <tr key={d.id}>
                      <td>{d.producto_codigo}</td>
                      <td>{d.producto_nombre}</td>
                      <td style={{textAlign:'right'}}>{Number(d.cantidad).toLocaleString('es-GT', {minimumFractionDigits: 2})} {d.unidad_medida}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(d.costo_unitario)}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="campo"><span>Subtotal</span> <strong>{formatearMoneda(detalleCompra.subtotal)}</strong></div>
              <div className="campo"><span>IVA (12%)</span> <strong>{formatearMoneda(detalleCompra.iva)}</strong></div>
              <div className="campo"><span>Total</span> <strong style={{fontSize:'18px'}}>{formatearMoneda(detalleCompra.total)}</strong></div>
              <div className="campo"><span>Pagado</span> <strong>{formatearMoneda(detalleCompra.monto_pagado)}</strong></div>
              <div className="campo"><span>Saldo pendiente</span> <strong style={{color: detalleCompra.saldo_pendiente > 0 ? '#dc2626' : '#16a34a'}}>{formatearMoneda(detalleCompra.saldo_pendiente)}</strong></div>
            </div>

            {detalleCompra.pagos?.length && (
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
                        <th>Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleCompra.pagos.map(p => (
                        <tr key={p.id}>
                          <td>{formatearFecha(p.fecha)}</td>
                          <td>{formatearMoneda(p.monto)}</td>
                          <td>{p.metodo}</td>
                          <td>{p.referencia || '—'}</td>
                          <td>{p.usuario_nombre || '—'}</td>
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
          </div>
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