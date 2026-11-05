import Modal from '../../components/Modal';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';
import ImagenProducto from './ImagenProducto';

function textoStock(valor) {
  const numero = Number(valor || 0);
  return formatearNumero(numero, Number.isInteger(numero) ? 0 : 2);
}

function estadoStockProducto(producto) {
  if (producto.tipo === 'servicio') return 'no_aplica';
  if (producto.agotado || Number(producto.stock_actual || 0) <= 0) return 'agotado';
  if (producto.stock_bajo) return 'stock_bajo';
  return 'disponible';
}

function etiquetaEstadoStock(producto) {
  const estado = estadoStockProducto(producto);
  if (estado === 'agotado') return 'Agotado';
  if (estado === 'stock_bajo') return 'Stock bajo';
  if (estado === 'disponible') return 'Disponible';
  return 'Servicio';
}

function claseChipEstado(producto) {
  const estado = estadoStockProducto(producto);
  if (estado === 'agotado' || estado === 'stock_bajo') return 'chip-peligro';
  if (estado === 'disponible') return 'chip-ok';
  return 'chip-rol';
}

export default function ProductoDetalleModal({
  producto,
  onCerrar,
  onEditar,
  onCambiarEstado,
  onEliminar,
  puedeEditar,
  puedeEliminar,
  verCostos
}) {
  if (!producto) return null;

  const esServicio = producto.tipo === 'servicio';

  return (
    <Modal
      abierto
      titulo="Detalle del producto"
      onCerrar={onCerrar}
      ancho="900px"
    >
      <p className="inventario-detalle-subtitulo">Información completa e imagen del producto</p>

      <div className="inventario-detalle">
        <div className="inventario-detalle-imagen">
          <ImagenProducto
            producto={producto}
            variante="imagen"
            alt={producto.nombre}
            textoVacio="Este producto todavía no tiene imagen."
          />
        </div>

        <div className="inventario-detalle-info">
          <div className="inventario-detalle-titulo">
            <h3>{producto.nombre}</h3>
            <span className={`chip ${producto.activo ? 'chip-ok' : 'chip-peligro'}`}>
              {producto.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <dl className="inventario-detalle-datos">
            <div>
              <dt>Código</dt>
              <dd>{producto.codigo || '—'}</dd>
            </div>
            <div>
              <dt>Código de barra</dt>
              <dd>{producto.codigo_barras || '—'}</dd>
            </div>
            <div>
              <dt>Proveedor</dt>
              <dd>{producto.proveedor_nombre || '—'}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{producto.categoria_nombre || 'Sin categoría'}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>
                <span className={`chip ${producto.tipo === 'servicio' ? 'chip-rol' : 'chip-ok'}`}>
                  {producto.tipo === 'servicio' ? 'Servicio' : 'Producto'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Presentación</dt>
              <dd>{producto.presentacion || '—'}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{producto.ubicacion || '—'}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>
                {esServicio ? 'N/A' : `${textoStock(producto.stock_actual)} ${producto.unidad_medida || 'UNI'}`}
                {!esServicio && (
                  <span className={`chip ${claseChipEstado(producto)} inventario-detalle-chip`}>
                    {etiquetaEstadoStock(producto)}
                  </span>
                )}
              </dd>
            </div>
            {verCostos && !esServicio && (
              <>
                <div>
                  <dt>Costo último</dt>
                  <dd>{formatearMoneda(producto.costo_ultimo)}</dd>
                </div>
                <div>
                  <dt>Costo promedio</dt>
                  <dd>{formatearMoneda(producto.costo_promedio)}</dd>
                </div>
              </>
            )}
            <div>
              <dt>Precio venta</dt>
              <dd>{formatearMoneda(producto.precio_venta)}</dd>
            </div>
            <div className="inventario-detalle-full">
              <dt>Detalle</dt>
              <dd>{producto.descripcion || 'Sin descripción'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="inventario-detalle-acciones">
        <button type="button" className="btn btn-secundario" onClick={onCerrar}>
          Cerrar
        </button>
        {puedeEditar && (
          <button type="button" className="btn btn-secundario" onClick={() => onCambiarEstado(producto)}>
            {producto.activo ? 'Inactivar' : 'Activar'}
          </button>
        )}
        {puedeEliminar && (
          <button type="button" className="btn btn-danger" onClick={() => onEliminar(producto)}>
            Eliminar
          </button>
        )}
        {puedeEditar && (
          <button type="button" className="btn btn-primario" onClick={() => onEditar(producto)}>
            Editar producto
          </button>
        )}
      </div>
    </Modal>
  );
}