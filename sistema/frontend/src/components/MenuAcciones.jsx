import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Menú compacto de acciones para filas y tarjetas. Se dibuja en un portal para
// que no lo recorten las tarjetas ni el contenedor con scroll de la tabla.
export default function MenuAcciones({ acciones, etiqueta = 'Acciones' }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState(null);
  const contenedor = useRef(null);
  const boton = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    function cerrarSiEsFuera(evento) {
      if (contenedor.current?.contains(evento.target)) return;
      if (menu.current?.contains(evento.target)) return;
      setAbierto(false);
    }

    function cerrarConEscape(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }

    function cerrarPorVentana() {
      setAbierto(false);
    }

    document.addEventListener('mousedown', cerrarSiEsFuera);
    document.addEventListener('keydown', cerrarConEscape);
    window.addEventListener('resize', cerrarPorVentana);
    window.addEventListener('scroll', cerrarPorVentana, true);
    return () => {
      document.removeEventListener('mousedown', cerrarSiEsFuera);
      document.removeEventListener('keydown', cerrarConEscape);
      window.removeEventListener('resize', cerrarPorVentana);
      window.removeEventListener('scroll', cerrarPorVentana, true);
    };
  }, [abierto]);

  if (!acciones?.length) return null;

  function alternarMenu(evento) {
    evento.stopPropagation();
    if (abierto) {
      setAbierto(false);
      return;
    }

    const rect = boton.current?.getBoundingClientRect();
    if (!rect) return;
    const ancho = 180;
    const altoEstimado = 190;
    const izquierda = Math.min(
      Math.max(8, rect.right - ancho),
      Math.max(8, window.innerWidth - ancho - 8)
    );
    const arriba = rect.bottom + 4 + altoEstimado > window.innerHeight
      ? Math.max(8, rect.top - altoEstimado - 4)
      : rect.bottom + 4;

    setPosicion({ top: arriba, left: izquierda });
    setAbierto(true);
  }

  return (
    <div className="menu-acciones" ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="btn btn-opcion menu-acciones-toggle"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={alternarMenu}
      >
        ⋯
      </button>
      {abierto && posicion && createPortal(
        <div
          ref={menu}
          className="menu-acciones-lista menu-acciones-flotante"
          style={{ top: posicion.top, left: posicion.left }}
          role="menu"
        >
          {acciones.map((accion) => (
            <button
              key={accion.etiqueta}
              type="button"
              role="menuitem"
              className={`menu-acciones-item${accion.peligro ? ' menu-acciones-item-peligro' : ''}`}
              disabled={accion.deshabilitado}
              title={accion.titulo}
              onClick={(evento) => {
                evento.stopPropagation();
                setAbierto(false);
                accion.onClick();
              }}
            >
              {accion.etiqueta}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
