import { useEffect, useRef, useState } from 'react';
import { formatearMoneda } from '../../utils/formatos';

export default function ClienteAutocompletar({
  valor,
  onBuscar,
  sugerencias,
  onSeleccionar,
  onChange,
  onBlur,
  placeholder = 'Escriba para buscar un cliente...',
  disabled = false
}) {
  const [mostrar, setMostrar] = useState(false);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    const handler = (evento) => {
      if (
        listaRef.current &&
        !listaRef.current.contains(evento.target) &&
        inputRef.current !== evento.target
      ) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function manejarInput(evento) {
    onChange(evento);
    if (evento.target.value.length >= 2) {
      onBuscar(evento.target.value);
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  }

  return (
    <div className="facturacion-autocompletar">
      <input
        ref={inputRef}
        type="text"
        className="control"
        value={valor}
        onChange={manejarInput}
        onFocus={() => {
          if (valor.length >= 2 && sugerencias.length > 0) setMostrar(true);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        disabled={disabled}
      />
      {mostrar && sugerencias.length > 0 && (
        <ul ref={listaRef} className="facturacion-sugerencias" role="listbox">
          {sugerencias.map((cliente) => (
            <li
              key={cliente.id}
              role="option"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                onSeleccionar(cliente);
                setMostrar(false);
              }}
            >
              <div className="facturacion-sugerencia-titulo">
                <strong>{cliente.nombre}</strong>
                <span className="facturacion-sugerencia-precio">
                  Saldo {formatearMoneda(cliente.saldo_actual)}
                </span>
              </div>
              <div className="facturacion-sugerencia-detalle">
                <span>NIT: {cliente.nit}</span>
                {cliente.telefono && <span>Tel: {cliente.telefono}</span>}
                <span>
                  {Number(cliente.dias_credito) > 0
                    ? `Crédito ${cliente.dias_credito} días`
                    : 'Contado'}
                </span>
                {cliente.es_predeterminado && <span>Predeterminado</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
