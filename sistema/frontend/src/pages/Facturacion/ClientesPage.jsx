import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import MenuAcciones from '../../components/MenuAcciones';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
import { formatearFecha, formatearMoneda } from '../../utils/formatos';
import { permisosFacturacion } from '../../utils/permisosFacturacion';
import ClienteDetalleModal from './ClienteDetalleModal';
import ClienteFormModal from './ClienteFormModal';

const PAGE_SIZE = 10;

function IconoBuscar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconoClientes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconoSaldo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  );
}

function IconoCobrar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c0-1.1-1.34-2-3-2s-3 .9-3 2 1.34 2 3 2 3 .9 3 2-1.34 2-3 2-3-.9-3-2" />
    </svg>
  );
}

export default function ClientesPage() {
  const notificar = useNotificacion();
  const permisos = permisosFacturacion();
  const solicitudActual = useRef(0);
  const detalleSolicitud = useRef(0);
  const primeraBusqueda = useRef(true);

  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [estado, setEstado] = useState('todos');
  const [orden, setOrden] = useState({ sortBy: 'nombre', sortDir: 'asc' });
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hayFiltros = Boolean(busquedaAplicada || estado !== 'todos');

  const cargarClientes = useCallback(async () => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = { page: pagina, pageSize: PAGE_SIZE, ...orden };
      if (busquedaAplicada) params.q = busquedaAplicada;
      if (estado !== 'todos') params.estado = estado;

      const res = await api.get('/clientes', { params });
      if (solicitud !== solicitudActual.current) return;
      const data = res.data || [];
      setClientes(data);
      const nuevoTotal = Number(res.total ?? data.length);
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (pagina > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setClientes([]);
      setTotal(0);
      setError(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, [pagina, busquedaAplicada, estado, orden, recarga]);

  const cargarResumen = useCallback(async () => {
    try {
      const res = await api.get('/clientes/resumen');
      setResumen(res.data || null);
    } catch {
      setResumen(null);
    }
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    if (primeraBusqueda.current) {
      primeraBusqueda.current = false;
      return undefined;
    }
    const temporizador = window.setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda]);

  function refrescar() {
    setRecarga((valor) => valor + 1);
    cargarResumen();
  }

  function cambiarOrden(columna, direccion) {
    setOrden({ sortBy: columna, sortDir: direccion });
    setPagina(1);
  }

  function limpiarFiltros() {
    setBusqueda('');
    setBusquedaAplicada('');
    setEstado('todos');
    setPagina(1);
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(cliente) {
    setEditando(cliente);
    setModalAbierto(true);
  }

  async function abrirDetalle(cliente) {
    const solicitud = ++detalleSolicitud.current;
    setDetalle({ ...cliente, facturas: [], cargando: true });
    try {
      const res = await api.get(`/clientes/${cliente.id}`);
      if (solicitud !== detalleSolicitud.current) return;
      setDetalle({ ...res.data, cargando: false });
    } catch (err) {
      if (solicitud !== detalleSolicitud.current) return;
      setDetalle(null);
      notificar.error(err.message);
    }
  }

  function cerrarDetalle() {
    detalleSolicitud.current += 1;
    setDetalle(null);
  }

  function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Cliente guardado correctamente');
    refrescar();
  }

  async function confirmarInactivar() {
    const objetivo = confirmando;
    if (!objetivo) return;
    try {
      await api.patch(`/clientes/${objetivo.id}/estado`, { estado: 'inactivo' });
      notificar.exito('Cliente inactivado');
      setConfirmando(null);
      refrescar();
    } catch (err) {
      setConfirmando(null);
      notificar.error(err.message);
    }
  }

  async function activar(cliente) {
    try {
      await api.patch(`/clientes/${cliente.id}/estado`, { estado: 'activo' });
      notificar.exito('Cliente activado');
      refrescar();
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function accionesCliente(cliente) {
    const acciones = [
      { etiqueta: 'Ver detalle', onClick: () => abrirDetalle(cliente) }
    ];
    if (permisos.gestionarClientes && !cliente.es_predeterminado) {
      acciones.push({ etiqueta: 'Editar', onClick: () => abrirEdicion(cliente) });
      acciones.push({
        etiqueta: cliente.estado === 'activo' ? 'Inactivar' : 'Activar',
        onClick: () => {
          if (cliente.estado === 'activo') setConfirmando(cliente);
          else activar(cliente);
        }
      });
    }
    return acciones;
  }

  return (
    <section className="facturacion-clientes">
      <header className="inventario-encabezado">
        <div>
          <h2>Clientes</h2>
          <p className="reporte-detalle">
            Administra los clientes de facturación, su crédito y saldo pendiente.
          </p>
        </div>
        <div className="inventario-acciones-encabezado">
          <span className="inventario-conteo">
            {total} {total === 1 ? 'cliente' : 'clientes'}
          </span>
          {permisos.gestionarClientes && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>
              + Nuevo cliente
            </button>
          )}
        </div>
      </header>

      <div className="inventario-estadisticas">
        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-clientes">
            <IconoClientes />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? resumen.activos : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Clientes activos</span>
            <span className="facturacion-stat-detalle">
              {resumen ? `${total} registrados en el filtro actual` : ' '}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-saldo">
            <IconoSaldo />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? resumen.con_saldo_pendiente : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Clientes con saldo pendiente</span>
            <span className="facturacion-stat-detalle">
              {resumen?.con_saldo_pendiente ? 'Requieren seguimiento de cobro' : 'Sin saldos pendientes'}
            </span>
          </div>
        </div>

        <div className="inventario-estadistica">
          <span className="inventario-estadistica-icono facturacion-icono-cobrar">
            <IconoCobrar />
          </span>
          <div>
            <span className="inventario-estadistica-valor">
              {resumen ? formatearMoneda(resumen.total_por_cobrar) : '—'}
            </span>
            <span className="inventario-estadistica-etiqueta">Total por cobrar</span>
            <span className="facturacion-stat-detalle">
              Saldo pendiente de todas las facturas
            </span>
          </div>
        </div>
      </div>

      <div className="inventario-toolbar">
        <div className="inventario-buscador">
          <span className="inventario-buscador-icono"><IconoBuscar /></span>
          <input
            type="search"
            className="control"
            placeholder="Buscar por nombre, NIT, correo o teléfono..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar clientes"
          />
          {busqueda && (
            <button
              type="button"
              className="inventario-buscador-limpiar"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="control facturacion-filtro-estado"
          value={estado}
          onChange={(evento) => { setEstado(evento.target.value); setPagina(1); }}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {hayFiltros && (
        <div className="inventario-filtro-activo">
          <span>Filtros aplicados</span>
          <button type="button" className="btn btn-opcion" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      )}

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="inventario-listado">
        {cargando ? (
          <p className="estado">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <div className="inventario-vacio">
            <p>
              {hayFiltros
                ? 'No se encontraron clientes con los filtros seleccionados.'
                : 'Todavía no hay clientes registrados.'}
            </p>
            {permisos.gestionarClientes && !hayFiltros && (
              <button type="button" className="btn btn-primario" onClick={abrirAlta}>
                + Nuevo cliente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table className="tabla tabla-clientes">
                <thead>
                  <tr>
                    <ThOrdenable columna="nit" ordenActual={orden} onOrdenar={cambiarOrden}>
                      NIT
                    </ThOrdenable>
                    <ThOrdenable columna="nombre" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Cliente
                    </ThOrdenable>
                    <th>Contacto</th>
                    <th>Crédito</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                    <ThOrdenable columna="created_at" ordenActual={orden} onOrdenar={cambiarOrden}>
                      Registrado
                    </ThOrdenable>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <span className="facturacion-nit">{cliente.nit}</span>
                        {cliente.es_predeterminado && (
                          <span className="chip chip-rol facturacion-chip-predeterminado">Predeterminado</span>
                        )}
                      </td>
                      <td>
                        <div className="facturacion-cliente-celda">
                          <strong>{cliente.nombre}</strong>
                          <small>{cliente.correo || 'Sin correo registrado'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="facturacion-cliente-celda">
                          <span>{cliente.telefono || '—'}</span>
                          <small>{cliente.direccion || 'Sin dirección'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="facturacion-cliente-celda">
                          <span>{cliente.dias_credito} días</span>
                          <small>Límite {formatearMoneda(cliente.limite_credito)}</small>
                        </div>
                      </td>
                      <td className="reporte-numero">{formatearMoneda(cliente.saldo_actual)}</td>
                      <td>
                        <span className={`chip ${cliente.estado === 'activo' ? 'chip-ok' : 'chip-peligro'}`}>
                          {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{formatearFecha(cliente.created_at)}</td>
                      <td className="tabla-acciones">
                        <MenuAcciones
                          acciones={accionesCliente(cliente)}
                          etiqueta={`Acciones de ${cliente.nombre}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Paginacion
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>

      <ClienteFormModal
        abierto={modalAbierto}
        cliente={editando}
        onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        onGuardado={alGuardar}
      />

      <ClienteDetalleModal
        cliente={detalle}
        onCerrar={cerrarDetalle}
        onEditar={permisos.gestionarClientes && detalle && !detalle.es_predeterminado
          ? () => { const clienteActual = detalle; cerrarDetalle(); abrirEdicion(clienteActual); }
          : null}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo="Inactivar cliente"
        mensaje={`¿Desea inactivar a "${confirmando?.nombre}"? El cliente dejará de estar disponible para nuevas facturas y su historial se conservará.`}
        confirmarTexto="Inactivar"
        onConfirmar={confirmarInactivar}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}
