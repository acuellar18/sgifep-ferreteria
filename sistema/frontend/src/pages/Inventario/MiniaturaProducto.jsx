import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MiniaturaProducto({ producto, onAbrir }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const tieneImagen = Boolean(producto?.imagen || producto?.imagen_miniatura);

  useEffect(() => {
    setUrl('');
    setError(false);
    if (!producto?.id || !tieneImagen) return undefined;

    let activo = true;
    let objectUrl = '';
    api.get(`/productos/${producto.id}/imagen/miniatura`, { responseType: 'blob' })
      .then((blob) => {
        if (!activo) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (activo) setError(true);
      });

    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [producto?.id, producto?.imagen, producto?.imagen_miniatura, producto?.actualizado_en, tieneImagen]);

  if (!tieneImagen) return <span className="inventario-sin-imagen">Sin imagen</span>;

  return (
    <button
      type="button"
      className="inventario-miniatura"
      onClick={() => onAbrir?.(producto)}
      aria-label={`Ver imagen de ${producto.nombre}`}
    >
      {url ? <img src={url} alt={`Imagen de ${producto.nombre}`} loading="lazy" /> : null}
      {!url && !error ? <span aria-hidden="true">...</span> : null}
      {error ? <span aria-hidden="true">!</span> : null}
    </button>
  );
}
