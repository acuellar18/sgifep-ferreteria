import { useEffect, useRef, useState } from 'react';

export default function ProveedorAutocompletar({
  valor,
  onBuscar,
  sugerencias,
  onSeleccionar,
  onChange,
  onBlur,
  placeholder,
  disabled
}) {
  const [mostrar, setMostrar] = useState(false);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (listaRef.current && !listaRef.current.contains(e.target) && inputRef.current !== e.target) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function manejarFocus() {
    if (valor.trim().length === 0) {
      onBuscar('');
      setMostrar(true);
      return;
    }
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

  function manejarClick(proveedor) {
    onSeleccionar(proveedor);
    setMostrar(false);
  }

  if (disabled) {
    return (
      <div className="campo" style={{ gridColumn: '1 / -1' }}>
        <span>Proveedor seleccionado</span>
        <input type="text" className="control" value={valor} readOnly />
      </div>
    );
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
        aria-controls="proveedor-sugerencias"
        aria-expanded={mostrar}
      />
      {mostrar && sugerencias.length > 0 && (
        <ul
          ref={listaRef}
          id="proveedor-sugerencias"
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
            maxHeight: '240px',
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
              onMouseEnter={(e) => e.target.style.background = '#dcfce7'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <strong>{p.nombre}</strong>
              {p.nit && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>NIT: {p.nit}</span>}
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {p.telefono && `Tel: ${p.telefono}`} {p.correo && ` | ${p.correo}`}
              </div>
              {p.dias_credito > 0 && (
                <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '999px' }}>
                  Crédito: {p.dias_credito} días
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}