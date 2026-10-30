import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';
import ProductoFormModal from './ProductoFormModal';
import ProductoDetalleModal from './ProductoDetalleModal';
import ImagenProducto from './ImagenProducto';
import { permisosInventario } from '../../utils/permisosInventario';

const ESTADO_OPCIONES = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'inactivo', label: 'Inactivos' }
];

const TIPO_OPCIONES = [
  { value: '', label: 'Todos' },
  { value: 'producto', label: 'Productos' },
  { value: 'servicio', label: 'Servicios' }
];

const STOCK_OPCIONES = [
  { value: '', label: 'Todo el stock' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'bajo', label: 'Stock bajo' },
  { value: 'agotado', label: 'Agotados' }
];

export default function ProductosPage() {
  const notificar = useNotificacion();
  const permisos = permisosInventario();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estado: '', categoria: '', tipo: '', estadoStock: '' });
  const [paginacion, setPaginacion] = useState({ page: 1, pageSize: 20, total: 0 });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);

  const cargarCategorias = useCallback(async () => {
    try {
      const respuesta = await api.get('/productos/categorias');
      setCategorias(respuesta.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const params = {
        page: paginacion.page,
        pageSize: paginacion.pageSize
      };
      if (filtros.q) params.q = filtros.q;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.estadoStock) params.estadoStock = filtros.estadoStock;

      const respuesta = await api.get('/productos', { params });
      setProductos(Array.isArray(respuesta.data) ? respuesta.data : []);
      setPaginacion((prev) => ({ ...prev, total: respuesta.total || 0 }));
    } catch (err) {
      notificar.error(err.message || 'No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  }, [filtros, paginacion.page, paginacion.pageSize, notificar]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginacion((prev) => ({ ...prev, page: 1 }));
  }

  function abrirNuevo() {
    notificar.info('Los productos se crean desde el módulo de Compras.');
  }

  function abrirEditar(producto) {
    setProductoEditar(producto);
    setModalAbierto(true);
  }

  function abrirDetalle(producto) {
    setProductoDetalle(producto);
    setDetalleAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setProductoEditar(null);
  }

  async function cambiarEstado(producto) {
    const nuevoEstado = producto.activo ? 0 : 1;
    try {
      await api.put(`/productos/${producto.id}/estado`, { activo: nuevoEstado });
      notificar.exito(nuevoEstado ? 'Producto activado' : 'Producto inactivado');
      cargarProductos();
    } catch (err) {
      notificar.error(err.message || 'No se pudo cambiar el estado');
    }
  }

  async function eliminarProducto(producto) {
    const confirmar = window.confirm(
      `Eliminar el producto "${producto.nombre}"?\n\nEsta acción solo es posible si no tiene movimientos distintos al inventario inicial.`
    );
    if (!confirmar) return;
    try {
      await api.delete(`/productos/${producto.id}`);
      notificar.exito('Producto eliminado correctamente');
      cargarProductos();
    } catch (err) {
      notificar.error(err.message || 'No se pudo eliminar el producto');
    }
  }

  function alGuardar() {
    cerrarModal();
    cargarProductos();
  }

  const totalPaginas = Math.max(1, Math.ceil(paginacion.total / paginacion.pageSize));

  return (
    <div className="pagina productos-page">
      <div className="pagina-cabecera">
        <div>
          <h1>Productos</h1>
          <p>Inventario generado desde las compras</p>
        </div>
        <div className="pagina-acciones">
          <Link to="/compras/facturas/nueva" className="btn btn-primario">Registrar compra</Link>
        </div>
      </div>

      <div className="tarjeta tarjeta-sombra filtros-productos">
        <div className="filtros-grid filtros-grid-responsive">
          <div className="campo">
            <label>Buscar</label>
            <input
              className="control"
              placeholder="Código, nombre..."
              value={filtros.q}
              onChange={(e) => actualizarFiltro('q', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Estado</label>
            <select className="control" value={filtros.estado} onChange={(e) => actualizarFiltro('estado', e.target.value)}>
              {ESTADO_OPCIONES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Tipo</label>
            <select className="control" value={filtros.tipo} onChange={(e) => actualizarFiltro('tipo', e.target.value)}>
              {TIPO_OPCIONES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Categoría</label>
            <select className="control" value={filtros.categoria} onChange={(e) => actualizarFiltro('categoria', e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Stock</label>
            <select className="control" value={filtros.estadoStock} onChange={(e) => actualizarFiltro('estadoStock', e.target.value)}>
              {STOCK_OPCIONES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="tarjeta tarjeta-sombra">
        <div className="tabla-contenedor">
          <table className="tabla tabla-productos">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Proveedor</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Stock</th>
                <th>Precio de venta</th>
                {permisos.verCostosProductos && <th>Costo último</th>}
                {permisos.verCostosProductos && <th>Costo promedio</th>}
                <th>Estado</th>
                <th className="tabla-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={permisos.verCostosProductos ? 12 : 10}>Cargando...</td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={permisos.verCostosProductos ? 12 : 10}>
                    <div className="estado-vacio-inline">
                      <strong>Aún no hay productos.</strong>
                      <span>Se crean automáticamente al registrar una compra.</span>
                      <Link to="/compras/facturas/nueva" className="btn btn-primario">Registrar compra</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <ImagenProducto producto={producto} size="sm" />
                    </td>
                    <td>{producto.codigo}</td>
                    <td>
                      <button className="boton-link" onClick={() => abrirDetalle(producto)}>
                        {producto.nombre}
                      </button>
                    </td>
                    <td>{producto.proveedor_nombre || '-'}</td>
                    <td>{producto.categoria_nombre || '-'}</td>
                    <td>
                      <span className={`etiqueta ${producto.tipo === 'servicio' ? 'etiqueta-info' : 'etiqueta-gris'}`}>
                        {producto.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                      </span>
                    </td>
                    <td>
                      {producto.tipo === 'servicio' ? (
                        <span className="etiqueta etiqueta-gris">N/A</span>
                      ) : (
                        <span
                          className={`etiqueta ${
                            producto.agotado ? 'etiqueta-peligro' : producto.stock_bajo ? 'etiqueta-advertencia' : 'etiqueta-exito'
                          }`}
                        >
                          {formatearNumero(producto.stock_actual)} {producto.unidad_medida}
                        </span>
                      )}
                    </td>
                    <td>{formatearMoneda(producto.precio_venta)}</td>
                    {permisos.verCostosProductos && <td>{formatearMoneda(producto.costo_ultimo || 0)}</td>}
                    {permisos.verCostosProductos && <td>{formatearMoneda(producto.costo_promedio || 0)}</td>}
                    <td>
                      <span className={`etiqueta ${producto.activo ? 'etiqueta-exito' : 'etiqueta-gris'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="tabla-acciones">
                      <div className="acciones-grupo">
                        <button type="button" className="btn btn-opcion" onClick={() => abrirEditar(producto)}>
                          Editar
                        </button>
                        {permisos.gestionarProductos && (
                          <button type="button" className="btn btn-opcion" onClick={() => cambiarEstado(producto)}>
                            {producto.activo ? 'Inactivar' : 'Activar'}
                          </button>
                        )}
                        {permisos.eliminarProductos && (
                          <button type="button" className="btn btn-opcion btn-danger" onClick={() => eliminarProducto(producto)}>
                            Eliminar
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

        {totalPaginas > 1 && (
          <div className="paginacion">
            <button
              type="button"
              className="btn btn-secundario"
              disabled={paginacion.page === 1}
              onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Anterior
            </button>
            <span>
              Página {paginacion.page} de {totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn-secundario"
              disabled={paginacion.page === totalPaginas}
              onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      <ProductoFormModal
        abierto={modalAbierto}
        producto={productoEditar}
        categorias={categorias}
        permisos={permisos}
        onCerrar={cerrarModal}
        onGuardado={alGuardar}
      />

      <ProductoDetalleModal
        abierto={detalleAbierto}
        producto={productoDetalle}
        onCerrar={() => setDetalleAbierto(false)}
      />
    </div>
  );
}
