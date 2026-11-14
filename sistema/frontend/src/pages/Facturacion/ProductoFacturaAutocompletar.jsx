import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatearMoneda, formatearNumero } from '../../utils/formatos';

export default function ProductoFacturaAutocompletar({
  valor,
  onBuscar,
  sugerencias,
  onSeleccionar,
  onChange,
  onBlur,
  placeholder = 'Buscar por código o nombre...',
  inputRef
}) {
  const [mostrar, setMostrar] = useState(false);
  const [posicion, setPosicion] = useState(null);
  const refInterna = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    if (inputRef) inputRef.current = refInterna.current;
    const handler = (evento) => {
      if (
        listaRef.current &&
        !listaRef.current.contains(evento.target) &&
        refInterna.current !== evento.target
      ) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [inputRef]);

  // El listado se dibuja en un portal con posición fija: dentro de la tabla el
  // contenedor con scroll lo recortaba y las sugerencias no se veían.
  function actualizarPosicion() {
    const nodo = refInterna.current;
    if (!nodo) return;
    const rect = nodo.getBoundingClientRect();
    setPosicion({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    });
  }

  useEffect(() => {
    if (!mostrar) return undefined;
    actualizarPosicion();
    const manejarScroll = () => actualizarPosicion();
    window.addEventListener('scroll', manejarScroll, true);
    window.addEventListener('resize', manejarScroll);
    return () => {
      window.removeEventListener('scroll', manejarScroll, true);
      window.removeEventListener('resize', manejarScroll);
    };
  }, [mostrar]);

  function manejarInput(evento) {
    onChange(evento);
    if (evento.target.value.length >= 2) {
      actualizarPosicion();
      onBuscar(evento.target.value);
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  }

  return (
    <div className="facturacion-autocompletar">
      <input
        ref={refInterna}
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
      />
      {mostrar && sugerencias.length > 0 && posicion && createPortal(
        <ul
          ref={listaRef}
          className="facturacion-sugerencias"
          role="listbox"
          style={{
            position: 'fixed',
            top: posicion.top,
            left: posicion.left,
            right: 'auto',
            width: posicion.width,
            maxHeight: Math.max(120, Math.min(280, window.innerHeight - posicion.top - 12))
          }}
        >
          {sugerencias.map((producto) => (
            <li
              key={producto.id}
              role="option"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => {
                onSeleccionar(producto);
                setMostrar(false);
              }}
            >
              <div className="facturacion-sugerencia-titulo">
                <strong>{producto.nombre}</strong>
                <span className="facturacion-sugerencia-precio">
                  {formatearMoneda(producto.precio_venta)}
                </span>
              </div>
              <div className="facturacion-sugerencia-detalle">
                <span>Código: {producto.codigo}</span>
                <span>
                  {producto.tipo === 'servicio'
                    ? 'Servicio'
                    : `Stock: ${formatearNumero(producto.stock_actual, 0)} ${producto.unidad_medida}`}
                </span>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
