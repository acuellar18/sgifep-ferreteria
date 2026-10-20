import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

const MAXIMO = 2 * 1024 * 1024;
const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProductoImagenModal({
  abierto,
  producto,
  puedeEditar,
  onCerrar,
  onActualizado
}) {
  const [imagenUrl, setImagenUrl] = useState('');
  const [sinImagen, setSinImagen] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [recargar, setRecargar] = useState(0);

  useEffect(() => {
    if (!abierto) return;
    setArchivo(null);
    setError('');
    setSinImagen(false);
  }, [abierto, producto?.id]);

  useEffect(() => {
    if (!abierto || !producto?.id) return undefined;

    let activo = true;
    let objectUrl = '';
    setImagenUrl('');
    api.get(`/productos/${producto.id}/imagen`, { responseType: 'blob' })
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setImagenUrl(objectUrl);
        setSinImagen(false);
      })
      .catch(() => {
        if (activo) setSinImagen(true);
      });

    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [abierto, producto?.id, producto?.actualizado_en, recargar]);

  useEffect(() => {
    if (!archivo) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  function seleccionarArchivo(e) {
    setError('');
    const elegido = e.target.files?.[0];
    if (!elegido) {
      setArchivo(null);
      return;
    }
    if (!MIMES.includes(elegido.type)) {
      setError('La imagen debe ser JPG, PNG o WebP');
      e.target.value = '';
      return;
    }
    if (elegido.size > MAXIMO) {
      setError('La imagen no puede superar los 2 MB');
      e.target.value = '';
      return;
    }
    setArchivo(elegido);
  }

  async function subirImagen() {
    if (!archivo) {
      setError('Debe seleccionar una imagen');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('imagen', archivo);
      await api.post(`/productos/${producto.id}/imagen`, formData);
      setArchivo(null);
      setRecargar((valor) => valor + 1);
      onActualizado?.('Imagen del producto actualizada correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function eliminarImagen() {
    if (!window.confirm('¿Eliminar la imagen de este producto?')) return;
    setCargando(true);
    setError('');
    try {
      await api.delete(`/productos/${producto.id}/imagen`);
      setArchivo(null);
      setImagenUrl('');
      setSinImagen(true);
      setRecargar((valor) => valor + 1);
      onActualizado?.('Imagen del producto eliminada correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const fuente = previewUrl || imagenUrl;

  return (
    <Modal
      abierto={abierto}
      titulo={producto ? `Imagen · ${producto.nombre}` : 'Imagen del producto'}
      onCerrar={onCerrar}
      ancho="620px"
    >
      <div className="inventario-imagen-modal">
        {error && <div className="alerta alerta-error">{error}</div>}

        <div className="inventario-imagen-vista">
          {fuente ? (
            <img src={fuente} alt={`Imagen de ${producto?.nombre || 'producto'}`} />
          ) : sinImagen ? (
            <span>Este producto todavía no tiene imagen.</span>
          ) : (
            <span>Cargando imagen...</span>
          )}
        </div>

        {puedeEditar && (
          <>
            <label className="inventario-imagen-selector">
              <span>{archivo ? archivo.name : 'Seleccionar imagen'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={seleccionarArchivo}
                disabled={cargando}
              />
            </label>
            <p className="inventario-imagen-ayuda">
              JPG, PNG o WebP. Máximo 2 MB. La imagen se optimiza automáticamente y se genera una miniatura.
            </p>

            <div className="modal-acciones">
              {!sinImagen && !previewUrl && (
                <button type="button" className="btn btn-secundario" onClick={eliminarImagen} disabled={cargando}>
                  Eliminar imagen
                </button>
              )}
              <button type="button" className="btn btn-secundario" onClick={onCerrar} disabled={cargando}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primario"
                onClick={subirImagen}
                disabled={cargando || !archivo}
              >
                {cargando ? 'Procesando...' : 'Subir imagen'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
