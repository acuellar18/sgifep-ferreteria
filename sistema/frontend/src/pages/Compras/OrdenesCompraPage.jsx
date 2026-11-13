import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { permisosCompras } from '../../utils/permisosCompras';
import OrdenCompraFormModal from './OrdenCompraFormModal';
import RecibirMercaderiaModal from './RecibirMercaderiaModal';

const FILTROS_INICIALES = {
  q: '',
  proveedor: '',
  estado: ''
};

const PAGE_SIZE = 10;

export default function OrdenesCompraPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const notificar = useNotificacion();
  const esDetalle = Boolean(id);
  const esNueva = location.pathname.endsWith('/nueva');

  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'fecha', sortDir: 'desc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recibirAbierto, setRecibirAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalleOrden, setDetalleOrden] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const temporizadorBusqueda = useRef(null);

  const sesion = JSON.parse(localStorage.getItem('session') || '{}');
  const permisos = permisosCompras(sesion);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarOrdenes = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/ordenes-compra', { params });
      setOrdenes(res.data);
      const nuevoTotal = res.total ?? res.data.length;
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      setOrdenes([]);
      setTotal(0);
      setError(err.message);
    } finally {
      setCargando(false);
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
    if (!esDetalle && !esNueva) {
      cargarOrdenes(filtros, pagina, orden);
    }
  }, [esDetalle, esNueva, pagina, orden]);

  useEffect(() => {
    if (esDetalle) {
      cargarDetalle(id);
    }
  }, [id]);

  async function cargarDetalle(ordenId) {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(`/ordenes-compra/${ordenId}`);
      setDetalleOrden(res.data);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setCargando(false);
    }
  }

  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => {
        setPagina(1);
        cargarOrdenes(nuevos, 1, orden);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    setPagina(1);
    cargarOrdenes(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    cargarOrdenes(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(orden) {
    if (orden.estado !== 'borrador') {
      notificar.error('Solo se pueden editar órdenes en estado borrador');
      return;
    }
    setEditando(orden);
    setModalAbierto(true);
  }

  async function confirmarAccion(orden, accion) {
    setConfirmando({ ...orden, accion });
  }

  async function ejecutarAccion() {
    const target = confirmando;
    if (!target) return;
    setError('');
    try {
      if (target.accion === 'enviar') {
        await api.post(`/ordenes-compra/${target.id}/enviar`);
        notificar.exito('Orden marcada como enviada');
      } else if (target.accion === 'cancelar') {
        await api.post(`/ordenes-compra/${target.id}/cancelar`);
        notificar.exito('Orden cancelada');
      } else if (target.accion === 'eliminar') {
        await api.delete(`/ordenes-compra/${target.id}`);
        notificar.exito('Orden eliminada correctamente');
      }
      setConfirmando(null);
      if (esDetalle) await cargarDetalle(id);
      else await cargarOrdenes(filtros, pagina, orden);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Orden guardada correctamente');
    await cargarOrdenes(filtros, pagina, orden);
  }

  async function abrirRecibir(orden) {
    if (orden.estado === 'cancelada' || orden.estado === 'recibida') {
      notificar.error('No se puede recibir mercadería de esta orden');
      return;
    }
    setEditando(orden);
    setRecibirAbierto(true);
  }

  async function alRecibir(mensaje, compraId) {
    setRecibirAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Mercadería recibida correctamente');
    navigate(`/compras/${compraId}`);
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

  function chipEstado(estado) {
    const clases = {
      borrador: 'chip',
      enviada: 'chip-rol',
      recibida_parcial: 'chip-rol',
      recibida: 'chip-ok',
      cancelada: 'chip-peligro'
    };
    const etiquetas = {
      borrador: 'Borrador',
      enviada: 'Enviada',
      recibida_parcial: 'Recibida parcial',
      recibida: 'Recibida',
      cancelada: 'Cancelada'
    };
    return <span className={`chip ${clases[estado] || 'chip'}`}>{etiquetas[estado] || estado}</span>;
  }

  if (esDetalle) {
    if (cargando) return <p className="estado">Cargando orden...</p>;
    if (error) return <div className="alerta alerta-error">{error}</div>;
    if (!detalleOrden) return <p className="estado">Orden no encontrada</p>;

    const o = detalleOrden;
    const pendienteTotal = o.detalles?.reduce((s, d) => s + Math.max(0, Number(d.cantidad_solicitada) - Number(d.cantidad_recibida)), 0) || 0;

    return (
      <section>
        <div className="encabezado-pagina">
          <div>
            <h2>{o.numero}</h2>
            <p className="reporte-detalle">
              Proveedor: {o.proveedor_nombre}  |  Fecha: {formatearFecha(o.fecha)}
              {o.fecha_esperada && `  |  Entrega esperada: ${formatearFecha(o.fecha_esperada)}`}
            </p>
          </div>
          <div className="acciones-encabezado">
            {chipEstado(o.estado)}
            {permisos.crearOrden && o.estado === 'borrador' && (
              <>
                <button type="button" className="btn btn-primario" onClick={() => setConfirmando({ ...o, accion: 'enviar' })}>
                  Enviar orden
                </button>
                <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(o)}>Editar</button>
              </>
            )}
            {permisos.recibirOrden && (o.estado === 'borrador' || o.estado === 'enviada' || o.estado === 'recibida_parcial') && (
              <button type="button" className="btn btn-primario" onClick={() => abrirRecibir(o)}>
                Recibir mercadería
              </button>
            )}
            {permisos.crearOrden && (o.estado === 'borrador' || o.estado === 'cancelada') && (
              <button type="button" className="btn btn-danger" onClick={() => setConfirmando({ ...o, accion: 'eliminar' })}>
                Eliminar
              </button>
            )}
            {permisos.crearOrden && (o.estado === 'borrador' || o.estado === 'enviada' || o.estado === 'recibida_parcial') && (
              <button type="button" className="btn btn-opcion" onClick={() => setConfirmando({ ...o, accion: 'cancelar' })}>
                Cancelar
              </button>
            )}
            <a href={`/usuarios/compras/ordenes-compra.html?id=${o.id}`} target="_blank" className="btn btn-secundario">
              Imprimir / Compartir
            </a>
          </div>
        </div>

        <div className="tarjetas">
          <div className="tarjeta">
            <span className="tarjeta-valor">{formatearMoneda(o.total_estimado)}</span>
            <span className="tarjeta-etiqueta">Total estimado</span>
          </div>
          <div className="tarjeta">
            <span className="tarjeta-valor">{o.detalles?.length || 0}</span>
            <span className="tarjeta-etiqueta">Productos</span>
          </div>
          <div className="tarjeta tarjeta-peligro">
            <span className="tarjeta-valor">{formatearMoneda(pendienteTotal)}</span>
            <span className="tarjeta-etiqueta">Pendiente de recibir</span>
          </div>
        </div>

        <h3 style={{ margin: '16px 0 8px' }}>Productos</h3>
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th style={{textAlign:'center'}}>Solicitado</th>
                <th style={{textAlign:'center'}}>Recibido</th>
                <th style={{textAlign:'center'}}>Pendiente</th>
                <th style={{textAlign:'right'}}>Costo est.</th>
              </tr>
            </thead>
            <tbody>
              {o.detalles?.map(d => (
                <tr key={d.id}>
                  <td>{d.codigo}</td>
                  <td>{d.nombre}</td>
                  <td style={{textAlign:'center'}}>{Number(d.cantidad_solicitada).toLocaleString('es-GT', {minimumFractionDigits: 2})} {d.unidad_medida}</td>
                  <td style={{textAlign:'center'}}>{Number(d.cantidad_recibida).toLocaleString('es-GT', {minimumFractionDigits: 2})} {d.unidad_medida}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{color: d.pendiente > 0 ? 'var(--color-peligro)' : 'var(--color-primario)', fontWeight: 600}}>
                      {d.pendiente.toLocaleString('es-GT', {minimumFractionDigits: 2})} {d.unidad_medida}
                    </span>
                  </td>
                  <td style={{textAlign:'right'}}>{formatearMoneda(d.costo_estimado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {o.notas && (
          <p className="reporte-detalle" style={{ marginTop: '16px' }}>
            <strong>Notas:</strong> {o.notas}
          </p>
        )}
      </section>
    );
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Órdenes de Compra</h2>
        <div className="acciones-encabezado">
          {permisos.crearOrden && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>
              + Nueva orden
            </button>
          )}
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
          value={filtros.estado}
          onChange={(e) => cambiarFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="">Estado: todos</option>
          <option value="borrador">Borrador</option>
          <option value="enviada">Enviada</option>
          <option value="recibida_parcial">Recibida parcial</option>
          <option value="recibida">Recibida</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </FilterBar>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando órdenes...</p>
      ) : ordenes.length === 0 ? (
        <p className="estado">No se encontraron órdenes con los filtros aplicados.</p>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="numero" ordenActual={orden} onOrdenar={cambiarOrden}>N° orden</ThOrdenable>
                  <ThOrdenable columna="fecha" ordenActual={orden} onOrdenar={cambiarOrden}>Fecha</ThOrdenable>
                  <ThOrdenable columna="proveedor_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Proveedor</ThOrdenable>
                  <ThOrdenable columna="fecha_esperada" ordenActual={orden} onOrdenar={cambiarOrden}>Entrega esperada</ThOrdenable>
                  <th>Estado</th>
                  <ThOrdenable columna="total_estimado" ordenActual={orden} onOrdenar={cambiarOrden}>Total est.</ThOrdenable>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id}>
                    <td>{o.numero}</td>
                    <td>{formatearFecha(o.fecha)}</td>
                    <td>{o.proveedor_nombre}</td>
                    <td>{formatearFecha(o.fecha_esperada)}</td>
                    <td>{chipEstado(o.estado)}</td>
                    <td>{formatearMoneda(o.total_estimado)}</td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn btn-opcion" onClick={() => navigate(`/compras/ordenes/${o.id}`)}>
                          Ver
                        </button>
                        {permisos.crearOrden && o.estado === 'borrador' && (
                          <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(o)}>
                            Editar
                          </button>
                        )}
                        {permisos.recibirOrden && (o.estado === 'borrador' || o.estado === 'enviada' || o.estado === 'recibida_parcial') && (
                          <button type="button" className="btn btn-primario" onClick={() => abrirRecibir(o)}>
                            Recibir
                          </button>
                        )}
                        {permisos.crearOrden && (o.estado === 'borrador' || o.estado === 'enviada') && (
                          <button type="button" className="btn btn-opcion" onClick={() => confirmarAccion(o, 'enviar')}>
                            Enviar
                          </button>
                        )}
                        {permisos.crearOrden && (o.estado === 'borrador' || o.estado === 'enviada' || o.estado === 'recibida_parcial') && (
                          <button type="button" className="btn btn-opcion" onClick={() => confirmarAccion(o, 'cancelar')}>
                            Cancelar
                          </button>
                        )}
                        {permisos.crearOrden && (o.estado === 'borrador' || o.estado === 'cancelada') && (
                          <button type="button" className="btn btn-opcion btn-danger" onClick={() => confirmarAccion(o, 'eliminar')}>
                            Eliminar
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

      <OrdenCompraFormModal
        abierto={modalAbierto}
        orden={editando}
        proveedores={proveedores}
        onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        onGuardado={alGuardar}
      />

      <RecibirMercaderiaModal
        abierto={recibirAbierto}
        orden={editando}
        proveedores={proveedores}
        onCerrar={() => { setRecibirAbierto(false); setEditando(null); }}
        onRecibido={alRecibir}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={
          confirmando?.accion === 'eliminar' ? 'Eliminar orden' :
          confirmando?.accion === 'cancelar' ? 'Cancelar orden' : 'Enviar orden'
        }
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar la orden "${confirmando?.numero}"?`
            : confirmando?.accion === 'cancelar'
            ? `¿Desea cancelar la orden "${confirmando?.numero}"?`
            : `¿Desea marcar como enviada la orden "${confirmando?.numero}"?`
        }
        confirmarTexto={
          confirmando?.accion === 'eliminar' ? 'Eliminar' :
          confirmando?.accion === 'cancelar' ? 'Cancelar orden' : 'Enviar'
        }
        onConfirmar={ejecutarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}