import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';
import CategoriaFormModal from './CategoriaFormModal';
import BarcodeScanner from '../../components/BarcodeScanner';

const MAXIMO_IMAGEN = 5 * 1024 * 1024;
const MIMES_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];

const FORM_VACIO = {
  codigo: '',
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  presentacion: '',
  ubicacion: '',
  categoria_id: '',
  tipo: 'producto',
  unidad_medida: 'UNI',
  stock_minimo: '0',
  precio_venta: '0',
  activo: true
};

function crearCodigo() {
  return `P-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

function desdeProducto(producto) {
  return {
    codigo: producto.codigo || '',
    codigo_barras: producto.codigo_barras || '',
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    presentacion: producto.presentacion || '',
    ubicacion: producto.ubicacion || '',
    categoria_id: producto.categoria_id ? String(producto.categoria_id) : '',
    tipo: producto.tipo || 'producto',
    unidad_medida: producto.unidad_medida || 'UNI',
    stock_minimo: String(producto.stock_minimo ?? 0),
    precio_venta: String(producto.precio_venta ?? 0),
    activo: Boolean(producto.activo)
  };
}

export default function ProductoFormModal({
  abierto,
  producto,
  categorias,
  permisos,
  onCerrar,
  onGuardado
}) {
  const notificar = useNotificacion();
  const [form, setForm] = useState(FORM_VACIO);
  const [categoriasLocal, setCategoriasLocal] = useState(categorias);
  const [categoriaModalAbierto, setCategoriaModalAbierto] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [codigoDuplicado, setCodigoDuplicado] = useState(false);

  const esAlta = !producto;
  const esServicio = form.tipo === 'servicio';
  const verCostos = permisos.verCostosProductos;
  const puedeCrearCategoria = permisos.gestionarCategorias;

  useEffect(() => {
    setCategoriasLocal(categorias);
  }, [categorias]);

  useEffect(() => {
    if (!abierto) return;
    setError('');
    setArchivo(null);
    setCategoriaModalAbierto(false);
    setForm(producto ? desdeProducto(producto) : { ...FORM_VACIO, codigo: crearCodigo() });
  }, [abierto, producto]);

  useEffect(() => {
    if (!archivo) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  function actualizarCampo(campo, valor) {
    if (campo === 'codigo_barras') setCodigoDuplicado(false);
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function alDetectarCodigo(codigo) {
    const limpio = String(codigo || '').trim();
    actualizarCampo('codigo_barras', limpio);
    setError('');
    setCodigoDuplicado(false);
    if (!limpio) return;

    setVerificandoCodigo(true);
    try {
      const respuesta = await api.get('/productos', {
        params: { q: limpio, pageSize: 50 }
      });
      const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
      const duplicado = lista.find(
        (item) =>
          String(item.codigo_barras || '').trim() === limpio &&
          Number(item.id) !== Number(producto?.id)
      );
      if (duplicado) {
        setCodigoDuplicado(true);
        setError(`El código de barras ya está asignado al producto "${duplicado.nombre}".`);
        notificar.error('Ese código de barras ya está en uso');
      } else {
        notificar.exito(`Código ${limpio} listo para guardar`);
      }
    } catch {
      // Si la verificación falla, el backend valida el duplicado al guardar.
    } finally {
      setVerificandoCodigo(false);
    }
  }

  function seleccionarArchivo(evento) {
    setError('');
    const elegido = evento.target.files?.[0];
    if (!elegido) {
      setArchivo(null);
      return;
    }
    if (!MIMES_IMAGEN.includes(elegido.type)) {
      setError('La imagen debe ser JPG, PNG o WebP');
      setArchivo(null);
      evento.target.value = '';
      return;
    }
    if (elegido.size > MAXIMO_IMAGEN) {
      setError('La imagen no puede superar los 5 MB');
      setArchivo(null);
      evento.target.value = '';
      return;
    }
    setArchivo(elegido);
  }

  async function subirImagen(id) {
    const datos = new FormData();
    datos.append('imagen', archivo);
    await api.post(`/productos/${id}/imagen`, datos);
  }

  async function recargarCategorias() {
    try {
      const respuesta = await api.get('/productos/categorias');
      setCategoriasLocal(respuesta.data || []);
    } catch {
      // La categoría ya se creó; si falla la recarga se mantiene la lista actual.
    }
  }

  function alCrearCategoria(data) {
    setCategoriaModalAbierto(false);
    if (data?.id) {
      setForm((prev) => ({ ...prev, categoria_id: String(data.id) }));
    }
    recargarCategorias();
  }

  function cerrarFormulario() {
    if (categoriaModalAbierto) return;
    onCerrar();
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    if (esAlta) {
      setError('La creación manual de productos está deshabilitada. Los productos se crean desde Compras.');
      notificar.error('Los productos se crean desde el módulo de Compras');
      return;
    }
    if (codigoDuplicado) {
      setError('El código de barras ya está asignado a otro producto. Corrígelo antes de guardar.');
      return;
    }
    setCargando(true);

    const payload = {
      codigo: (producto.codigo || form.codigo).trim(),
      codigo_barras: form.codigo_barras.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      presentacion: form.presentacion.trim(),
      ubicacion: form.ubicacion.trim(),
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      tipo: form.tipo,
      unidad_medida: form.unidad_medida,
      stock_minimo: Number(form.stock_minimo || 0),
      precio_venta: Number(form.precio_venta || 0),
      activo: form.activo
    };

    try {
      if (producto?.id) {
        await api.put(`/productos/${producto.id}`, payload);
        if (archivo) {
          try {
            await subirImagen(producto.id);
          } catch (errImg) {
            notificar.error(errImg.message || 'El producto se guardó, pero no se pudo subir la imagen');
          }
        }
        notificar.exito('Producto actualizado correctamente');
      }
      onGuardado();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    } finally {
      setCargando(false);
    }
  }

  const titulo = esAlta ? 'Nuevo producto' : 'Editar producto';

  return (
    <>
      <Modal
        abierto={abierto}
        titulo={titulo}
        onCerrar={cerrarFormulario}
      >
        <form id="form-producto" className="formulario" onSubmit={enviar}>
          {error && <div className="alerta alerta-error">{error}</div>}
          {esAlta && (
            <div className="alerta alerta-info">
              Los productos se crean desde el módulo de Compras. Usa "Registrar compra" para dar de alta productos con stock inicial.
            </div>
          )}
          <div className="formulario-grid">
            <div className="campo">
              <label>Código</label>
              <input className="control" value={form.codigo} readOnly />
            </div>
            <div className="campo">
              <label>Código de barras</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="control"
                  value={form.codigo_barras}
                  onChange={(e) => actualizarCampo('codigo_barras', e.target.value)}
                  placeholder="Escanear o escribir"
                />
                <BarcodeScanner onDetectado={alDetectarCodigo} />
              </div>
              {verificandoCodigo && <small style={{ color: '#6b7280' }}>Verificando...</small>}
              {codigoDuplicado && <small style={{ color: '#dc2626' }}>Código duplicado</small>}
            </div>
            <div className="campo campo-completo">
              <label>Nombre *</label>
              <input
                className="control"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                required
                readOnly={esAlta}
              />
            </div>
            <div className="campo campo-completo">
              <label>Descripción</label>
              <textarea
                className="control"
                rows="2"
                value={form.descripcion}
                onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                readOnly={esAlta}
              />
            </div>
            <div className="campo">
              <label>Categoría</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="control"
                  value={form.categoria_id}
                  onChange={(e) => actualizarCampo('categoria_id', e.target.value)}
                  disabled={esAlta && !puedeCrearCategoria}
                >
                  <option value="">Sin categoría</option>
                  {categoriasLocal.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {puedeCrearCategoria && !esAlta && (
                  <button type="button" className="btn btn-secundario" onClick={() => setCategoriaModalAbierto(true)}>
                    +
                  </button>
                )}
              </div>
            </div>
            <div className="campo">
              <label>Proveedor</label>
              <input
                className="control"
                value={producto?.proveedor_nombre || 'Sin proveedor'}
                readOnly
              />
            </div>
            <div className="campo">
              <label>Tipo</label>
              <select
                className="control"
                value={form.tipo}
                onChange={(e) => actualizarCampo('tipo', e.target.value)}
                disabled={esAlta}
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <div className="campo">
              <label>Unidad de medida</label>
              <select
                className="control"
                value={form.unidad_medida}
                onChange={(e) => actualizarCampo('unidad_medida', e.target.value)}
                disabled={esAlta}
              >
                <option value="UNI">Unidad</option>
                <option value="MTS">Metro</option>
                <option value="KG">Kilogramo</option>
                <option value="LT">Litro</option>
                <option value="GL">Galón</option>
                <option value="CJA">Caja</option>
                <option value="PAQ">Paquete</option>
                <option value="ROL">Rollo</option>
              </select>
            </div>
            <div className="campo">
              <label>Presentación</label>
              <input
                className="control"
                value={form.presentacion}
                onChange={(e) => actualizarCampo('presentacion', e.target.value)}
                readOnly={esAlta}
              />
            </div>
            <div className="campo">
              <label>Ubicación</label>
              <input
                className="control"
                value={form.ubicacion}
                onChange={(e) => actualizarCampo('ubicacion', e.target.value)}
                readOnly={esAlta}
              />
            </div>
            <div className="campo">
              <label>Stock mínimo</label>
              <input
                type="number"
                min="0"
                className="control"
                value={form.stock_minimo}
                onChange={(e) => actualizarCampo('stock_minimo', e.target.value)}
                readOnly={esAlta}
              />
            </div>
            <div className="campo">
              <label>Precio de venta</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="control"
                value={form.precio_venta}
                onChange={(e) => actualizarCampo('precio_venta', e.target.value)}
              />
            </div>
            {!esAlta && verCostos && (
              <div className="campo campo-completo">
                <small style={{ color: '#6b7280' }}>
                  Los costos se actualizan automáticamente desde las compras.
                </small>
              </div>
            )}
            {!esAlta && (
              <div className="campo campo-completo">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => actualizarCampo('activo', e.target.checked)}
                  />
                  Producto activo
                </label>
              </div>
            )}
            {!esAlta && (
              <div className="campo campo-completo">
                <label>Imagen del producto</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={seleccionarArchivo} />
                {previewUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <img src={previewUrl} alt="Vista previa" className="inventario-form-preview" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-acciones" style={{ flexWrap: 'wrap' }}>
            {!esAlta && (
              <Link
                to="/compras/facturas/nueva"
                className="btn btn-secundario"
                onClick={cerrarFormulario}
              >
                Agregar más productos
              </Link>
            )}
            <button type="button" className="btn btn-secundario" onClick={cerrarFormulario} disabled={cargando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={cargando || esAlta}>
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
      {puedeCrearCategoria && !esAlta && (
        <CategoriaFormModal
          abierto={categoriaModalAbierto}
          onCerrar={() => setCategoriaModalAbierto(false)}
          onGuardado={alCrearCategoria}
        />
      )}
    </>
  );
}
