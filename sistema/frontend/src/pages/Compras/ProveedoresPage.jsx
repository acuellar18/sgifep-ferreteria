import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { permisosCompras } from '../../utils/permisosCompras';
import ProveedorFormModal from './ProveedorFormModal';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos'
};

const PAGE_SIZE = 10;

export default function ProveedoresPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notificar = useNotificacion();
  const esFicha = Boolean(id);

  const [proveedores, setProveedores] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'nombre', sortDir: 'asc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [ficha, setFicha] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const temporizadorBusqueda = useRef(null);

  const sesion = JSON.parse(localStorage.getItem('session') || '{}');
  const permisos = permisosCompras(sesion);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarProveedores = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/proveedores', { params });
      setProveedores(res.data);
      const nuevoTotal = res.total ?? res.data.length;
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      setProveedores([]);
      setTotal(0);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!esFicha) {
      cargarProveedores(filtros, pagina, orden);
    }
  }, [esFicha, pagina, orden]);

  useEffect(() => {
    if (esFicha) {
      cargarFicha(id);
    }
  }, [id]);

  async function cargarFicha(proveedorId) {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(`/proveedores/${proveedorId}/ficha`);
      setFicha(res.data);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      navigate('/compras/proveedores');
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
        cargarProveedores(nuevos, 1, orden);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    setPagina(1);
    cargarProveedores(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    cargarProveedores(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(proveedor) {
    setEditando(proveedor);
    setModalAbierto(true);
  }

  async function verFicha(proveedor) {
    try {
      const res = await api.get(`/proveedores/${proveedor.id}/ficha`);
      setFicha(res.data);
      setDetalleAbierto(true);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  async function confirmarAccion() {
    const target = confirmando;
    if (!target) return;
    setError('');
    try {
      if (target.accion === 'estado') {
        await api.patch(`/proveedores/${target.id}/estado`, { activo: target.activo ? 0 : 1 });
        notificar.exito(target.activo ? 'Proveedor inactivado' : 'Proveedor activado');
        if (esFicha) await cargarFicha(id);
      } else if (target.accion === 'eliminar') {
        await api.delete(`/proveedores/${target.id}`);
        notificar.exito('Proveedor eliminado correctamente');
        navigate('/compras/proveedores');
      }
      setConfirmando(null);
      if (!esFicha) await cargarProveedores(filtros, pagina, orden);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Proveedor guardado correctamente');
    if (!esFicha) await cargarProveedores(filtros, pagina, orden);
    else await cargarFicha(id);
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

  if (esFicha) {
    if (cargando) return <p className="estado">Cargando ficha del proveedor...</p>;
    if (error) return <div className="alerta alerta-error">{error}</div>;
    if (!ficha) return <p className="estado">Proveedor no encontrado</p>;

    return (
      <section>
        <div className="encabezado-pagina">
          <div>
            <h2>{ficha.nombre}</h2>
            <p className="reporte-detalle">
              {ficha.nit && `NIT: ${ficha.nit}  |  `}{ficha.telefono && `Tel: ${ficha.telefono}  |  `}
              {ficha.correo && `Email: ${ficha.correo}`}
            </p>
          </div>
          <div className="acciones-encabezado">
            <span className={`chip ${ficha.activo ? 'chip-ok' : 'chip-peligro'}`}>
              {ficha.activo ? 'Activo' : 'Inactivo'}
            </span>
            {permisos.editarProveedor && (
              <>
                <button type="button" className="btn btn-secundario" onClick={() => setConfirmando({ accion: 'estado', ...ficha })}>
                  {ficha.activo ? 'Inactivar' : 'Activar'}
                </button>
                <button type="button" className="btn btn-secundario" onClick={abrirEdicion}>
                  Editar
                </button>
              </>
            )}
            <a
              href={`https://wa.me/502${ficha.telefono?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secundario"
              style={{ background: '#25D366', color: 'white', borderColor: '#25D366' }}
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="tarjetas">
          <div className="tarjeta">
            <span className="tarjeta-valor">{formatearMoneda(ficha.saldo_pendiente)}</span>
            <span className="tarjeta-etiqueta">Saldo pendiente</span>
          </div>
          <div className="tarjeta tarjeta-peligro">
            <span className="tarjeta-valor">{formatearMoneda(ficha.total_compras)}</span>
            <span className="tarjeta-etiqueta">Total comprado</span>
          </div>
        </div>

        <div className="reporte-grid">
          <div>
            <h3>Datos de contacto</h3>
            <div className="tabla-wrapper">
              <table className="tabla">
                <tbody>
                  <tr><th style={{width:'180px'}}>Dirección</th><td>{ficha.direccion || '—'}</td></tr>
                  <tr><th>Días de crédito</th><td>{ficha.dias_credito || 0}</td></tr>
                  <tr><th>Notas</th><td>{ficha.notas || '—'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3>Productos que surte ({ficha.productos?.length || 0})</h3>
            {ficha.productos?.length ? (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Costo último</th>
                      <th>Preferido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.productos.map(p => (
                      <tr key={p.id}>
                        <td>{p.codigo}</td>
                        <td>{p.nombre}</td>
                        <td>{formatearMoneda(p.costo_ultimo)}</td>
                        <td>{p.es_preferido ? '⭐' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="estado">Sin productos asociados</p>
            )}
          </div>
        </div>

        <div>
          <h3>Historial de compras ({ficha.compras?.length || 0})</h3>
          {ficha.compras?.length ? (
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <ThOrdenable columna="fecha" ordenActual={orden} onOrdenar={cambiarOrden}>Fecha</ThOrdenable>
                    <ThOrdenable columna="numero" ordenActual={orden} onOrdenar={cambiarOrden}>N° compra</ThOrdenable>
                    <ThOrdenable columna="numero_factura" ordenActual={orden} onOrdenar={cambiarOrden}>N° factura</ThOrdenable>
                    <ThOrdenable columna="total" ordenActual={orden} onOrdenar={cambiarOrden}>Total</ThOrdenable>
                    <th>Estado pago</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ficha.compras.map(c => (
                    <tr key={c.id}>
                      <td>{formatearFecha(c.fecha)}</td>
                      <td>{c.numero}</td>
                      <td>{c.numero_factura || '—'}</td>
                      <td>{formatearMoneda(c.total)}</td>
                      <td>
                        <span className={`chip ${
                          c.estado_pago === 'pagada' ? 'chip-ok' :
                          c.estado_pago === 'parcial' ? 'chip-rol' :
                          'chip-peligro'
                        }`}>
                          {c.estado_pago === 'pagada' ? 'Pagada' : c.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${c.estado === 'anulada' ? 'chip-peligro' : 'chip-ok'}`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="estado">Sin compras registradas</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <h2>Proveedores</h2>
        <div className="acciones-encabezado">
          {permisos.editarProveedor && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>
              + Agregar proveedor
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
          value={filtros.estado}
          onChange={(e) => cambiarFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </FilterBar>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando proveedores...</p>
      ) : proveedores.length === 0 ? (
        <p className="estado">No se encontraron proveedores con los filtros aplicados.</p>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <ThOrdenable columna="nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Nombre</ThOrdenable>
                  <ThOrdenable columna="nit" ordenActual={orden} onOrdenar={cambiarOrden}>NIT</ThOrdenable>
                  <ThOrdenable columna="telefono" ordenActual={orden} onOrdenar={cambiarOrden}>Teléfono</ThOrdenable>
                  <ThOrdenable columna="correo" ordenActual={orden} onOrdenar={cambiarOrden}>Correo</ThOrdenable>
                  <th>Saldo pendiente</th>
                  <th>Estado</th>
                  <ThOrdenable columna="creado_en" ordenActual={orden} onOrdenar={cambiarOrden}>Creado</ThOrdenable>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.nit || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.correo || '—'}</td>
                    <td>{formatearMoneda(p.saldo_pendiente)}</td>
                    <td>
                      <span className={`chip ${p.activo ? 'chip-ok' : 'chip-peligro'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatearFecha(p.creado_en)}</td>
                    <td>
                      <div className="acciones-fila">
                        <button type="button" className="btn btn-opcion" onClick={() => verFicha(p)}>
                          Ver ficha
                        </button>
                        {permisos.editarProveedor && (
                          <>
                            <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(p)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-opcion"
                              onClick={() => setConfirmando({ accion: 'estado', ...p })}
                            >
                              {p.activo ? 'Inactivar' : 'Activar'}
                            </button>
                          </>
                        )}
                        {permisos.eliminarProveedor && p.saldo_pendiente === 0 && !p.activo && (
                          <button
                            type="button"
                            className="btn btn-opcion btn-danger"
                            onClick={() => setConfirmando({ accion: 'eliminar', ...p })}
                          >
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

      <ProveedorFormModal
        abierto={modalAbierto}
        proveedor={editando}
        onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        onGuardado={alGuardar}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar proveedor' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar a "${confirmando?.nombre}"? Esta acción no se puede deshacer.`
            : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} al proveedor "${confirmando?.nombre}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}