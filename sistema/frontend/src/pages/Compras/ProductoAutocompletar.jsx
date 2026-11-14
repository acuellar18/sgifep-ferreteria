import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ProductoAutocompletar({
  valor,
  onBuscar,
  sugerencias,
  onSeleccionar,
  onChange,
  onBlur,
  placeholder,
  ref
}) {
  const [mostrar, setMostrar] = useState(false);
  const [posicion, setPosicion] = useState(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    if (ref) ref.current = inputRef.current;
    const handler = (e) => {
      if (listaRef.current && !listaRef.current.contains(e.target) && inputRef.current !== e.target) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref]);

  // El listado se dibuja en un portal con posición fija: la tabla de compras
  // tiene scroll propio y recortaba las sugerencias (solo se veía una franja).
  // Si no hay espacio debajo del campo, se abre hacia arriba para que se vea.
  function actualizarPosicion() {
    const nodo = inputRef.current;
    if (!nodo) return;
    const rect = nodo.getBoundingClientRect();
    const margen = 8;
    const espacioAbajo = window.innerHeight - rect.bottom - margen;
    const espacioArriba = rect.top - margen;
    const haciaArriba = espacioAbajo < 240 && espacioArriba > espacioAbajo;
    const alto = Math.max(120, Math.min(280, haciaArriba ? espacioArriba : espacioAbajo));
    setPosicion({
      left: rect.left,
      width: Math.max(300, rect.width),
      maxHeight: alto,
      top: haciaArriba ? undefined : rect.bottom + 4,
      bottom: haciaArriba ? window.innerHeight - rect.top + 4 : undefined
    });
  }

  useEffect(() => {
    if (!mostrar) return undefined;
    actualizarPosicion();
    const manejar = () => actualizarPosicion();
    window.addEventListener('scroll', manejar, true);
    window.addEventListener('resize', manejar);
    return () => {
      window.removeEventListener('scroll', manejar, true);
      window.removeEventListener('resize', manejar);
    };
  }, [mostrar]);

  function manejarFocus() {
    if (valor.length >= 2 && sugerencias.length > 0) {
      actualizarPosicion();
      setMostrar(true);
    }
  }

  function manejarInput(e) {
    onChange(e);
    if (e.target.value.length >= 2) {
      actualizarPosicion();
      onBuscar(e.target.value);
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  }

  function manejarClick(producto) {
    onSeleccionar(producto);
    setMostrar(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        className="control"
        value={valor}
        onChange={manejarInput}
        onFocus={manejarFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls="producto-sugerencias"
        aria-expanded={mostrar}
      />
      {mostrar && sugerencias.length > 0 && posicion && createPortal(
        <ul
          ref={listaRef}
          id="producto-sugerencias"
          role="listbox"
          style={{
            position: 'fixed',
            top: posicion.top,
            bottom: posicion.bottom,
            left: posicion.left,
            right: 'auto',
            width: posicion.width,
            background: 'var(--color-superficie)',
            color: 'var(--color-texto)',
            border: '1px solid var(--color-borde)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: posicion.maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 1100,
            listStyle: 'none',
            padding: '4px',
            margin: 0
          }}
        >
          {sugerencias.map(p => (
            <li
              key={p.id}
              role="option"
              onClick={() => manejarClick(p)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--color-primario-suave)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <strong style={{ wordBreak: 'break-word' }}>{p.nombre}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-primario)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(p.costo_ultimo || 0)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-texto-suave)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
                <span>Código: {p.codigo}</span>
                <span>Stock: {Number(p.stock_actual || 0).toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {p.unidad_medida}</span>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
