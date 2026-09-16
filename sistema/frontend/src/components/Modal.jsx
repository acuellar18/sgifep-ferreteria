import { useEffect } from 'react';

// Modal genérico reutilizable en todo el módulo.
export default function Modal({ abierto, titulo, onCerrar, children, ancho }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const manejarTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal"
        style={ancho ? { maxWidth: ancho } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}