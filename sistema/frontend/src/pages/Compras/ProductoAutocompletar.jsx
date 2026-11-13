import { useEffect, useRef, useState } from 'react';

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

  function manejarFocus() {
    if (valor.length >= 2 && sugerencias.length > 0) setMostrar(true);
  }

  function manejarInput(e) {
    onChange(e);
    if (e.target.value.length >= 2) {
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
      {mostrar && sugerencias.length > 0 && (
        <ul
          ref={listaRef}
          id="producto-sugerencias"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 100,
            listStyle: 'none',
            padding: '4px',
            margin: '4px 0 0'
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{p.nombre}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-primario)', fontWeight: 600 }}>
                  {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(p.costo_ultimo || 0)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-texto-suave)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                <span>Código: {p.codigo}</span>
                <span>Stock: {Number(p.stock_actual || 0).toLocaleString('es-GT', {minimumFractionDigits: 2})} {p.unidad_medida}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}