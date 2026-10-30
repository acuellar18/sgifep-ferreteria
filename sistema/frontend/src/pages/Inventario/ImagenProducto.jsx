import { useEffect, useState } from 'react';
import api from '../../services/api';

function IconoProducto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z" />
      <path d="M3.3 8.7 12 14l8.7-5.3" />
      <path d="M12 14v7" />
    </svg>
  );
}

function inicialesCategoria(categoria) {
  const palabras = String(categoria || '').trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return 'PR';
  return palabras.slice(0, 2).map((palabra) => palabra[0]).join('').toUpperCase();
}

export default function ImagenProducto({
  producto,
  variante = 'miniatura',
  alt,
  className = '',
  textoVacio,
  mostrarIniciales = false
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const tieneImagen = Boolean(producto?.imagen || producto?.imagen_miniatura);

  useEffect(() => {
    setUrl('');
    setError(false);
    if (!producto?.id || !tieneImagen) return undefined;

    let activo = true;
    let objectUrl = '';
    const ruta = variante === 'imagen'
      ? `/productos/${producto.id}/imagen`
      : `/productos/${producto.id}/imagen/miniatura`;

    api.get(ruta, { responseType: 'blob' })
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
  }, [producto?.id, producto?.imagen, producto?.imagen_miniatura, producto?.actualizado_en, variante, tieneImagen]);

  if (!tieneImagen || error) {
    if (textoVacio) {
      return <span className={`inventario-imagen-vacia-texto ${className}`.trim()}>{textoVacio}</span>;
    }
    if (mostrarIniciales) {
      return (
        <span className={`inventario-imagen-vacia inventario-imagen-iniciales ${className}`.trim()} aria-hidden="true">
          {inicialesCategoria(producto?.categoria_nombre)}
        </span>
      );
    }
    return (
      <span className={`inventario-imagen-vacia ${className}`.trim()} aria-hidden="true">
        <IconoProducto />
      </span>
    );
  }

  if (!url) {
    return <span className={`inventario-imagen-cargando ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <img
      src={url}
      alt={alt || `Imagen de ${producto?.nombre || 'producto'}`}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
