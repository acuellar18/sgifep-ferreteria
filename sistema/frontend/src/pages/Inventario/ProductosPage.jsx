import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
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

  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [productoDetalle, setProductoDetalle] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const sesion = JSON.parse(localStorage.getItem('session') || '{}');
  const esAdmin = sesion?.superadmin || (Array.isArray(sesion?.roles) && sesion.roles.includes('administrador'));

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
      const params = { page: paginacion.page, pageSize: paginacion.pageSize };
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

  function limpiarFiltros() {
    setFiltros({ q: '', estado: '', categoria: '', tipo: '', estadoStock: '' });
    setPaginacion((prev) => ({ ...prev, page: 1 }));
  }

  function abrirDetalle(producto) {
    setProductoDetalle(producto);
    setDetalleAbierto(true);
  }

  function abrirEditar(producto) {
    setProductoEditar(producto);
    setModalAbierto(true);
    setDetalleAbierto(false);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setProductoEditar(null);
  }

  function alGuardar() {
    cerrarModal();
    cargarProductos();
  }

  async function cambiarEstado(producto) {
    const nuevoEstado = producto.activo ? 0 : 1;
    try {
      await api.patch(`/productos/${producto.id}/estado`, { activo: nuevoEstado });
      notificar.exito(nuevoEstado ? 'Producto activado' : 'Producto inactivado');
      setProductos((prev) => prev.map((p) =>
        p.id === producto.id ? { ...p, activo: Boolean(nuevoEstado) } : p
      ));
      if (productoDetalle?.id === producto.id) {
        setProductoDetalle({ ...productoDetalle, activo: Boolean(nuevoEstado) });
      }
    } catch (err) {
      notificar.error(err.message || 'No se pudo cambiar el estado');
    }
  }

  async function confirmarEliminar() {
    if (!productoAEliminar) return;
    try {
      await api.delete(`/productos/${productoAEliminar.id}`);
      notificar.exito('Producto eliminado correctamente');
      setProductoAEliminar(null);
      setDetalleAbierto(false);
      setProductoDetalle(null);
      cargarProductos();
    } catch (err) {
      notificar.error(err.message || 'No se pudo eliminar el producto');
      setProductoAEliminar(null);
    }
  }

  function estadoStock(producto) {
    if (producto.tipo === 'servicio') return null;
    if (producto.agotado || Number(producto.stock_actual || 0) <= 0) return 'agotado';
    if (producto.stock_bajo) return 'bajo';
    return null;
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

      <div className="filterbar">
        <input
          className="control"
          placeholder="Buscar código, nombre..."
          value={filtros.q}
          onChange={(e) => actualizarFiltro('q', e.target.value)}
        />
        <select className="control" value={filtros.estado} onChange={(e) => actualizarFiltro('estado', e.target.value)}>
          {ESTADO_OPCIONES.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <select className="control" value={filtros.tipo} onChange={(e) => actualizarFiltro('tipo', e.target.value)}>
          {TIPO_OPCIONES.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <select className="control" value={filtros.categoria} onChange={(e) => actualizarFiltro('categoria', e.target.value)}>
          <option value="">Todas</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        <select className="control" value={filtros.estadoStock} onChange={(e) => actualizarFiltro('estadoStock', e.target.value)}>
          {STOCK_OPCIONES.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <button type="button" className="btn btn-secundario" onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>

      {!cargando && (
        <div className="inventario-conteo">
          {paginacion.total} {paginacion.total === 1 ? 'producto' : 'productos'} encontrados
        </div>
      )}

      {cargando ? (
        <div className="estado">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="estado-vacio">
          <h3>Aún no hay productos</h3>
          <p>Los productos se crean automáticamente al registrar una compra.</p>
          <div className="estado-vacio-acciones">
            <Link to="/compras/facturas/nueva" className="btn btn-primario">Registrar compra</Link>
          </div>
        </div>
      ) : (
        <div className="inventario-grid">
          {productos.map((producto) => {
            const st = estadoStock(producto);
            return (
              <div
                key={producto.id}
                className={`inventario-producto-card${producto.activo ? '' : ' inventario-producto-card-inactivo'}`}
                onClick={() => abrirDetalle(producto)}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle de ${producto.nombre}`}
              >
                <div className="inventario-producto-card-media">
                  <ImagenProducto
                    producto={producto}
                    className="inventario-producto-card-imagen"
                    variante="miniatura"
                    mostrarIniciales
                  />
                  {st && (
                    <div className="inventario-producto-card-badges">
                      <span className={`chip ${st === 'agotado' ? 'chip-peligro' : 'chip-rol'}`}>
                        {st === 'agotado' ? 'Sin stock' : 'Stock bajo'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="inventario-producto-card-cuerpo">
                  <h3 className="producto-card-nombre">{producto.nombre}</h3>
                  <p className="inventario-producto-card-categoria">
                    {producto.proveedor_nombre ? `Proveedor: ${producto.proveedor_nombre}` : 'Sin proveedor'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      <ProductoDetalleModal
        abierto={detalleAbierto}
        producto={productoDetalle}
        onCerrar={() => { setDetalleAbierto(false); setProductoDetalle(null); }}
        onEditar={abrirEditar}
        onCambiarEstado={(prod) => cambiarEstado(prod)}
        onEliminar={(prod) => setProductoAEliminar(prod || productoDetalle)}
        puedeEditar={esAdmin}
        puedeEliminar={esAdmin}
        verCostos={permisos.verCostosProductos}
      />

      <ProductoFormModal
        abierto={modalAbierto}
        producto={productoEditar}
        categorias={categorias}
        permisos={permisos}
        onCerrar={cerrarModal}
        onGuardado={alGuardar}
      />

      <ConfirmDialog
        abierto={Boolean(productoAEliminar)}
        titulo="Eliminar producto"
        mensaje={
          productoAEliminar
            ? `\u00bfSeguro que desea eliminar el producto "${productoAEliminar.nombre}"? Solo es posible si no tiene movimientos distintos al inventario inicial. Esta acci\u00f3n no se puede deshacer.`
            : ''
        }
        confirmarTexto="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setProductoAEliminar(null)}
      />
    </div>
  );
}