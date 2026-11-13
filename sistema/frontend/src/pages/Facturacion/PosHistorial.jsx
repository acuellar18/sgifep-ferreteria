import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { formatearFechaHora, formatearMoneda } from '../../utils/formatos';

const METODOS = [
  { valor: '', etiqueta: 'Todos los métodos' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'credito', etiqueta: 'Crédito' }
];

const ETIQUETAS_METODO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito'
};

const TIPOS_DEVOLUCION = [
  { valor: 'reembolso', etiqueta: 'Reembolso' },
  { valor: 'nota_credito', etiqueta: 'Nota de crédito' }
];

const METODOS_DEVOLUCION = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'credito', etiqueta: 'Crédito (nota de crédito)' }
];

function fechaLocal() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

const FILTROS_INICIALES = {
  desde: fechaLocal(),
  hasta: fechaLocal(),
  metodo_pago: '',
  estado: '',
  q: ''
};

const FORMULARIO_DEVOLUCION = {
  tipo: 'reembolso',
  metodo_pago: 'efectivo',
  motivo: ''
};

export default function PosHistorial({
  recargar = 0,
  onVer,
  onCambio,
  puedeAnular = false,
  puedeDevolver = false
}) {
  const notificar = useNotificacion();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
  const [data, setData] = useState({ data: [], total: 0, page: 1, pageSize: 10 });
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ventaAnular, setVentaAnular] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [ventaDevolucion, setVentaDevolucion] = useState(null);
  const [detalleDevolucion, setDetalleDevolucion] = useState(null);
  const [lineasDevolucion, setLineasDevolucion] = useState({});
  const [formDevolucion, setFormDevolucion] = useState(FORMULARIO_DEVOLUCION);
  const [cargandoDevolucion, setCargandoDevolucion] = useState(false);
  const [guardandoDevolucion, setGuardandoDevolucion] = useState(false);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const res = await api.get('/pos/ventas', {
          params: { ...aplicados, page: pagina, pageSize: 10 }
        });
        if (!activo) return;
        setData({
          data: res.data || [],
          total: Number(res.total || 0),
          page: Number(res.page || 1),
          pageSize: Number(res.pageSize || 10)
        });
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [aplicados, pagina, recargar]);

  function cambiarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicar(evento) {
    evento.preventDefault();
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      notificar.error('La fecha inicial no puede ser mayor que la final');
      return;
    }
    setPagina(1);
    setAplicados({ ...filtros });
  }

  function limpiar() {
    const nuevos = { ...FILTROS_INICIALES };
    setFiltros(nuevos);
    setAplicados(nuevos);
    setPagina(1);
  }

  function abrirAnulacion(venta) {
    setVentaAnular(venta);
    setMotivo('');
  }

  async function confirmarAnulacion(evento) {
    evento.preventDefault();
    if (!motivo.trim()) {
      notificar.error('Escribe el motivo de la anulación');
      return;
    }
    setAnulando(true);
    try {
      await api.post(`/pos/ventas/${ventaAnular.id}/anular`, { motivo: motivo.trim() });
      notificar.exito('Venta anulada. El inventario fue devuelto.');
      setVentaAnular(null);
      setData((prev) => ({ ...prev }));
      onCambio?.();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setAnulando(false);
    }
  }

  async function abrirDevolucion(venta) {
    setVentaDevolucion(venta);
    setDetalleDevolucion(null);
    setLineasDevolucion({});
    setFormDevolucion(FORMULARIO_DEVOLUCION);
    setCargandoDevolucion(true);
    try {
      const res = await api.get(`/pos/ventas/${venta.id}`);
      const detalle = res.data;
      setDetalleDevolucion(detalle);
      const iniciales = {};
      for (const linea of detalle?.detalles || []) {
        iniciales[linea.id] = '';
      }
      setLineasDevolucion(iniciales);
    } catch (err) {
      notificar.error(err.message);
      setVentaDevolucion(null);
    } finally {
      setCargandoDevolucion(false);
    }
  }

  function cambiarLinea(id, valor) {
    setLineasDevolucion((prev) => ({ ...prev, [id]: valor }));
  }

  function cambiarFormDevolucion(campo, valor) {
    setFormDevolucion((prev) => ({ ...prev, [campo]: valor }));
  }

  function tipoCambia(valor) {
    setFormDevolucion((prev) => ({
      ...prev,
      tipo: valor,
      metodo_pago: valor === 'nota_credito' ? 'credito' : 'efectivo'
    }));
  }

  const totalDevolucion = (detalleDevolucion?.detalles || []).reduce((suma, linea) => {
    const cantidad = Number(lineasDevolucion[linea.id] || 0);
    const original = Number(linea.cantidad || 0);
    if (!cantidad || !original) return suma;
    return suma + Number(linea.subtotal || 0) * (cantidad / original);
  }, 0);

  async function confirmarDevolucion(evento) {
    evento.preventDefault();
    const detalles = (detalleDevolucion?.detalles || [])
      .map((linea) => ({
        detalle_venta_id: linea.id,
        cantidad: Number(lineasDevolucion[linea.id] || 0)
      }))
      .filter((linea) => linea.cantidad > 0);

    if (!detalles.length) {
      notificar.error('Selecciona al menos un producto y una cantidad');
      return;
    }
    if (!formDevolucion.motivo.trim()) {
      notificar.error('Escribe el motivo de la devolución');
      return;
    }
    if (formDevolucion.tipo === 'nota_credito' && formDevolucion.metodo_pago !== 'credito') {
      notificar.error('La nota de crédito debe usar el método crédito');
      return;
    }

    setGuardandoDevolucion(true);
    try {
      await api.post(`/pos/ventas/${ventaDevolucion.id}/devoluciones`, {
        tipo: formDevolucion.tipo,
        metodo_pago: formDevolucion.metodo_pago,
        motivo: formDevolucion.motivo.trim(),
        detalles
      });
      notificar.exito('Devolución registrada. El inventario fue actualizado.');
      setVentaDevolucion(null);
      onCambio?.();
    } catch (err) {
      notificar.error(err.message);
    } finally {
      setGuardandoDevolucion(false);
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="pos-historial">
      <form className="pos-filtros" onSubmit={aplicar}>
        <label className="campo">
          <span>Desde</span>
          <input
            type="date"
            className="control"
            value={filtros.desde}
            onChange={(e) => cambiarFiltro('desde', e.target.value)}
          />
        </label>
        <label className="campo">
          <span>Hasta</span>
          <input
            type="date"
            className="control"
            value={filtros.hasta}
            onChange={(e) => cambiarFiltro('hasta', e.target.value)}
          />
        </label>
        <label className="campo">
          <span>Método de pago</span>
          <select
            className="control"
            value={filtros.metodo_pago}
            onChange={(e) => cambiarFiltro('metodo_pago', e.target.value)}
          >
            {METODOS.map((metodo) => (
              <option key={metodo.valor} value={metodo.valor}>{metodo.etiqueta}</option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Estado</span>
          <select
            className="control"
            value={filtros.estado}
            onChange={(e) => cambiarFiltro('estado', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="completada">Completada</option>
            <option value="anulada">Anulada</option>
          </select>
        </label>
        <label className="campo pos-filtro-busqueda">
          <span>Buscar</span>
          <input
            type="search"
            className="control"
            placeholder="Ticket, factura, cliente o NIT"
            value={filtros.q}
            onChange={(e) => cambiarFiltro('q', e.target.value)}
          />
        </label>
        <div className="pos-filtros-acciones">
          <button type="submit" className="btn btn-primario">Aplicar</button>
          <button type="button" className="btn btn-secundario" onClick={limpiar}>Hoy</button>
        </div>
      </form>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="tabla-wrapper pos-tabla-wrapper">
        <table className="tabla pos-tabla">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Fecha y hora</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Artículos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" className="pos-tabla-vacia">Cargando ventas...</td></tr>
            ) : data.data.length === 0 ? (
              <tr><td colSpan="8" className="pos-tabla-vacia">No hay ventas para los filtros seleccionados.</td></tr>
            ) : (
              data.data.map((venta) => (
                <tr key={venta.id}>
                  <td><strong>{venta.numero}</strong></td>
                  <td>{formatearFechaHora(venta.creado_en)}</td>
                  <td>
                    <span className="pos-tabla-cliente">{venta.cliente_nombre}</span>
                    <small>{venta.cliente_nit}</small>
                  </td>
                  <td>{ETIQUETAS_METODO[venta.metodo_pago] || venta.metodo_pago}</td>
                  <td>{venta.lineas}</td>
                  <td><strong>{formatearMoneda(venta.total)}</strong></td>
                  <td>
                    <span className={`chip ${venta.estado === 'completada' ? 'chip-ok' : 'chip-peligro'}`}>
                      {venta.estado === 'completada' ? 'Completada' : 'Anulada'}
                    </span>
                  </td>
                  <td>
                    <div className="pos-tabla-acciones">
                      <button type="button" className="btn btn-secundario btn-mini" onClick={() => onVer(venta.id)}>
                        Ver ticket
                      </button>
                      {puedeDevolver && venta.estado === 'completada' && (
                        <button type="button" className="btn btn-secundario btn-mini" onClick={() => abrirDevolucion(venta)}>
                          Devolver
                        </button>
                      )}
                      {puedeAnular && venta.estado === 'completada' && (
                        <button type="button" className="btn btn-danger btn-mini" onClick={() => abrirAnulacion(venta)}>
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pos-paginacion">
        <span>
          {data.total === 0
            ? 'Sin resultados'
            : `Mostrando ${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} de ${data.total}`}
        </span>
        <div>
          <button
            type="button"
            className="btn btn-secundario btn-mini"
            onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
            disabled={pagina <= 1}
          >
            Anterior
          </button>
          <span className="pos-pagina">Página {pagina} de {totalPaginas}</span>
          <button
            type="button"
            className="btn btn-secundario btn-mini"
            onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
            disabled={pagina >= totalPaginas}
          >
            Siguiente
          </button>
        </div>
      </div>

      <Modal
        abierto={Boolean(ventaAnular)}
        titulo={`Anular venta ${ventaAnular?.numero || ''}`}
        onCerrar={() => !anulando && setVentaAnular(null)}
        ancho="480px"
      >
        <form className="pos-form-anulacion" onSubmit={confirmarAnulacion}>
          <p>
            Se devolverá el inventario de los productos vendidos y se anulará la factura asociada.
            Esta acción no se puede deshacer.
          </p>
          <label className="campo">
            <span>Motivo de la anulación *</span>
            <textarea
              className="control"
              rows="3"
              maxLength={255}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe por qué se anula la venta"
              required
            />
          </label>
          <div className="modal-acciones">
            <button type="button" className="btn btn-secundario" onClick={() => setVentaAnular(null)} disabled={anulando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger" disabled={anulando}>
              {anulando ? 'Anulando...' : 'Anular venta'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={Boolean(ventaDevolucion)}
        titulo={`Devolución de venta ${ventaDevolucion?.numero || ''}`}
        onCerrar={() => !guardandoDevolucion && setVentaDevolucion(null)}
        ancho="720px"
      >
        {cargandoDevolucion ? (
          <p>Cargando detalle de la venta...</p>
        ) : detalleDevolucion ? (
          <form className="pos-form-devolucion" onSubmit={confirmarDevolucion}>
            <div className="pos-devolucion-lineas">
              <table className="tabla pos-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Vendido</th>
                    <th>Devuelto</th>
                    <th>Disponible</th>
                    <th>Cantidad a devolver</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalleDevolucion.detalles || []).map((linea) => {
                    const disponible = Number(linea.cantidad) - Number(linea.devuelto || 0);
                    return (
                      <tr key={linea.id}>
                        <td>
                          <strong>{linea.producto_nombre}</strong>
                          <small>{linea.producto_codigo}</small>
                        </td>
                        <td>{linea.cantidad}</td>
                        <td>{linea.devuelto}</td>
                        <td>{disponible}</td>
                        <td>
                          <input
                            type="number"
                            className="control"
                            min="0"
                            max={disponible}
                            step="0.001"
                            value={lineasDevolucion[linea.id] || ''}
                            onChange={(e) => cambiarLinea(linea.id, e.target.value)}
                            disabled={disponible <= 0}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pos-devolucion-grid">
              <label className="campo">
                <span>Tipo de devolución *</span>
                <select
                  className="control"
                  value={formDevolucion.tipo}
                  onChange={(e) => tipoCambia(e.target.value)}
                >
                  {TIPOS_DEVOLUCION.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>{tipo.etiqueta}</option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Método *</span>
                <select
                  className="control"
                  value={formDevolucion.metodo_pago}
                  onChange={(e) => cambiarFormDevolucion('metodo_pago', e.target.value)}
                  disabled={formDevolucion.tipo === 'nota_credito'}
                >
                  {METODOS_DEVOLUCION.map((metodo) => (
                    <option key={metodo.valor} value={metodo.valor}>{metodo.etiqueta}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="campo">
              <span>Motivo *</span>
              <textarea
                className="control"
                rows="2"
                maxLength={255}
                value={formDevolucion.motivo}
                onChange={(e) => cambiarFormDevolucion('motivo', e.target.value)}
                placeholder="Describe el motivo de la devolución"
                required
              />
            </label>

            <div className="pos-devolucion-total">
              <span>Total estimado a devolver</span>
              <strong>{formatearMoneda(totalDevolucion)}</strong>
            </div>

            <div className="modal-acciones">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setVentaDevolucion(null)}
                disabled={guardandoDevolucion}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primario" disabled={guardandoDevolucion}>
                {guardandoDevolucion ? 'Registrando...' : 'Registrar devolución'}
              </button>
            </div>
          </form>
        ) : (
          <p>No se pudo cargar la venta.</p>
        )}
      </Modal>
    </div>
  );
}
