import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import FiltrosCompras from '../../components/FiltrosCompras';
import Paginacion from '../../components/Paginacion';
import ThOrdenable from '../../components/ThOrdenable';
import { useNotificacion } from '../../components/Toast';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';
import { permisosInventario } from '../../utils/permisosInventario';
import MiniaturaProducto from './MiniaturaProducto';
import ProductoFormModal from './ProductoFormModal';
import ProductoImagenModal from './ProductoImagenModal';

const FILTROS_INICIALES = {
  q: '',
  categoria: '',
  tipo: 'todos',
  estado: 'todos',
  stockBajo: false
};

const PAGE_SIZE = 10;

export default function ProductosPage() {
  const notificar = useNotificacion();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [orden, setOrden] = useState({ sortBy: 'nombre', sortDir: 'asc' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [imagenProducto, setImagenProducto] = useState(null);
  const solicitudActual = useRef(0);

  const permisos = permisosInventario();
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cargarProductos = useCallback(async (filtrosActuales, paginaActual, ordenActual) => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = { page: paginaActual, pageSize: PAGE_SIZE, ...ordenActual };
      if (filtrosActuales.q) params.q = filtrosActuales.q;
      if (filtrosActuales.categoria) params.categoria = filtrosActuales.categoria;
      if (filtrosActuales.tipo !== 'todos') params.tipo = filtrosActuales.tipo;
      if (filtrosActuales.estado !== 'todos') params.estado = filtrosActuales.estado;
      if (filtrosActuales.stockBajo) params.stockBajo = 'true';

      const res = await api.get('/productos', { params });
      if (solicitud !== solicitudActual.current) return;
      setProductos(res.data || []);
      const nuevoTotal = Number(res.total ?? res.data?.length ?? 0);
      setTotal(nuevoTotal);
      const ultimaPagina = Math.max(1, Math.ceil(nuevoTotal / PAGE_SIZE));
      if (paginaActual > ultimaPagina) setPagina(ultimaPagina);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setProductos([]);
      setTotal(0);
      setError(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    api.get('/productos/categorias')
      .then((res) => {
        if (activo) setCategorias(res.data || []);
      })
      .catch(() => {
        if (activo) setCategorias([]);
      });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    cargarProductos(filtros, pagina, orden);
  }, [pagina, orden, cargarProductos]);

  function aplicarFiltros(e) {
    e.preventDefault();
    setPagina(1);
    if (pagina === 1) cargarProductos(filtros, 1, orden);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
    if (pagina === 1) cargarProductos(FILTROS_INICIALES, 1, orden);
  }

  function cambiarOrden(sortBy, sortDir) {
    setOrden({ sortBy, sortDir });
  }

  function abrirAlta() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEdicion(producto) {
    setEditando(producto);
    setModalAbierto(true);
  }

  async function confirmarAccion() {
    const objetivo = confirmando;
    if (!objetivo) return;
    setError('');
    try {
      if (objetivo.accion === 'estado') {
        await api.patch(`/productos/${objetivo.id}/estado`, { activo: objetivo.activo ? 0 : 1 });
        notificar.exito(objetivo.activo ? 'Producto inactivado' : 'Producto activado');
      } else if (objetivo.accion === 'eliminar') {
        await api.delete(`/productos/${objetivo.id}`);
        notificar.exito('Producto eliminado correctamente');
      }
      setConfirmando(null);
      await cargarProductos(filtros, pagina, orden);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
      setConfirmando(null);
    }
  }

  async function alGuardar(mensaje) {
    setModalAbierto(false);
    setEditando(null);
    notificar.exito(mensaje || 'Producto guardado correctamente');
    await cargarProductos(filtros, pagina, orden);
  }

  async function alActualizarImagen(mensaje) {
    notificar.exito(mensaje);
    await cargarProductos(filtros, pagina, orden);
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h2>Productos</h2>
          <p className="reporte-detalle">
            Administra productos y servicios, sus precios, categorías e imágenes.
          </p>
        </div>
        <div className="acciones-encabezado">
          {permisos.gestionarProductos && (
            <button type="button" className="btn btn-primario" onClick={abrirAlta}>
              + Agregar producto
            </button>
          )}
        </div>
      </div>

      <FiltrosCompras
        filtros={filtros}
        onChange={setFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        placeholder="Buscar por código, código de barras o nombre..."
      >
        <select
          className="control"
          value={filtros.categoria}
          onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
        >
          <option value="">Categoría: todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
          ))}
        </select>
        <select
          className="control"
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
        >
          <option value="todos">Tipo: todos</option>
          <option value="producto">Productos</option>
          <option value="servicio">Servicios</option>
        </select>
        <select
          className="control"
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <label className="inventario-check-filtro">
          <input
            type="checkbox"
            checked={filtros.stockBajo}
            onChange={(e) => setFiltros({ ...filtros, stockBajo: e.target.checked })}
          />
          Solo stock bajo
        </label>
      </FiltrosCompras>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="estado">No se encontraron productos con los filtros aplicados.</p>
      ) : (
        <>
          <div className="tabla-wrapper">
            <table className="tabla inventario-tabla-productos">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <ThOrdenable columna="codigo" ordenActual={orden} onOrdenar={cambiarOrden}>Código</ThOrdenable>
                  <ThOrdenable columna="nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Producto</ThOrdenable>
                  <ThOrdenable columna="categoria_nombre" ordenActual={orden} onOrdenar={cambiarOrden}>Categoría</ThOrdenable>
                  <ThOrdenable columna="tipo" ordenActual={orden} onOrdenar={cambiarOrden}>Tipo</ThOrdenable>
                  <ThOrdenable columna="stock_actual" ordenActual={orden} onOrdenar={cambiarOrden}>Stock</ThOrdenable>
                  {permisos.verCostosProductos && <th>Costo prom.</th>}
                  <ThOrdenable columna="precio_venta" ordenActual={orden} onOrdenar={cambiarOrden}>Precio</ThOrdenable>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <MiniaturaProducto producto={producto} onAbrir={setImagenProducto} />
                    </td>
                    <td>
                      <span className="inventario-categoria-codigo">{producto.codigo}</span>
                      {producto.codigo_barras && (
                        <span className="inventario-producto-nombre">{producto.codigo_barras}</span>
                      )}
                    </td>
                    <td>
                      <strong>{producto.nombre}</strong>
                      {producto.descripcion && (
                        <span className="inventario-producto-nombre">{producto.descripcion}</span>
                      )}
                    </td>
                    <td>{producto.categoria_nombre || 'Sin categoría'}</td>
                    <td>
                      <span className={`chip ${producto.tipo === 'servicio' ? 'chip-rol' : 'chip-transparente'}`}>
                        {producto.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                      </span>
                    </td>
                    <td className="reporte-numero">
                      {producto.tipo === 'servicio' ? (
                        <span className="inventario-stock-servicio">N/A</span>
                      ) : (
                        <>
                          <strong>{formatearNumero(producto.stock_actual, 3)}</strong>
                          <span className="inventario-producto-nombre">
                            Mín. {formatearNumero(producto.stock_minimo, 3)}
                          </span>
                          {producto.stock_bajo && <span className="chip chip-peligro">Stock bajo</span>}
                        </>
                      )}
                    </td>
                    {permisos.verCostosProductos && (
                      <td className="reporte-numero">
                        {producto.tipo === 'servicio' ? '—' : formatearMoneda(producto.costo_promedio)}
                      </td>
                    )}
                    <td className="reporte-numero">{formatearMoneda(producto.precio_venta)}</td>
                    <td>
                      <span className={`chip ${producto.activo ? 'chip-ok' : 'chip-peligro'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-fila">
                        {permisos.gestionarProductos && (
                          <button type="button" className="btn btn-opcion" onClick={() => abrirEdicion(producto)}>
                            Editar
                          </button>
                        )}
                        <button type="button" className="btn btn-opcion" onClick={() => setImagenProducto(producto)}>
                          Imagen
                        </button>
                        {permisos.gestionarProductos && (
                          <button
                            type="button"
                            className="btn btn-opcion"
                            onClick={() => setConfirmando({ accion: 'estado', ...producto })}
                          >
                            {producto.activo ? 'Inactivar' : 'Activar'}
                          </button>
                        )}
                        {permisos.eliminarProductos && (
                          <button
                            type="button"
                            className="btn btn-opcion btn-danger"
                            onClick={() => setConfirmando({ accion: 'eliminar', ...producto })}
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

      <ProductoFormModal
        abierto={modalAbierto}
        producto={editando}
        categorias={categorias}
        permisos={permisos}
        onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        onGuardado={alGuardar}
      />

      <ProductoImagenModal
        abierto={Boolean(imagenProducto)}
        producto={imagenProducto}
        puedeEditar={permisos.gestionarProductos}
        onCerrar={() => setImagenProducto(null)}
        onActualizado={alActualizarImagen}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={confirmando?.accion === 'eliminar' ? 'Eliminar producto' : 'Cambiar estado'}
        mensaje={
          confirmando?.accion === 'eliminar'
            ? `¿Seguro que desea eliminar "${confirmando?.nombre}"? Solo es posible si no tiene movimientos, compras u órdenes asociadas.`
            : `¿Desea ${confirmando?.activo ? 'inactivar' : 'activar'} "${confirmando?.nombre}"?`
        }
        confirmarTexto={confirmando?.accion === 'eliminar' ? 'Eliminar' : 'Confirmar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}
