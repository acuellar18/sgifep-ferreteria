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
      <p className="inventario-detalle-subtitulo">Informaci\u00f3n completa e imagen del producto</p>

      <div className="inventario-detalle">
        <div className="inventario-detalle-imagen">
          <ImagenProducto
            producto={producto}
            variante="imagen"
            alt={producto.nombre}
            textoVacio="Este producto todav\u00eda no tiene imagen."
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
              <dt>C\u00f3digo</dt>
              <dd>{producto.codigo || '—'}</dd>
            </div>
            <div>
              <dt>C\u00f3digo de barra</dt>
              <dd>{producto.codigo_barras || '—'}</dd>
            </div>
            <div>
              <dt>Proveedor</dt>
              <dd>{producto.proveedor_nombre || '—'}</dd>
            </div>
            <div>
              <dt>Categor\u00eda</dt>
              <dd>{producto.categoria_nombre || 'Sin categor\u00eda'}</dd>
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
              <dt>Presentaci\u00f3n</dt>
              <dd>{producto.presentacion || '—'}</dd>
            </div>
            <div>
              <dt>Ubicaci\u00f3n</dt>
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
                  <dt>Costo \u00faltimo</dt>
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
              <dd>{producto.descripcion || 'Sin descripci\u00f3n'}</dd>
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