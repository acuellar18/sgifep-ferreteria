// <th> clicable para ordenar columnas, reutilizable en cualquier tabla.
// El componente solo dibuja la cabecera y la flecha ↑/↓; quien lo usa decide
// qué pasa al hacer clic (normalmente: alternar asc/desc y recargar datos).
//
// Uso:
//   <ThOrdenable columna="nombre" ordenActual={{ sortBy, sortDir }} onOrdenar={cambiarOrden}>
//     Nombre completo
//   </ThOrdenable>
export default function ThOrdenable({ columna, ordenActual, onOrdenar, children }) {
  const activa = ordenActual?.sortBy === columna;
  const direccion = activa ? ordenActual.sortDir : null;

  function alClic() {
    const nuevaDireccion = activa && direccion === 'asc' ? 'desc' : 'asc';
    onOrdenar(columna, nuevaDireccion);
  }

  return (
    <th className="th-ordenable" aria-sort={activa ? (direccion === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="th-ordenable-btn" onClick={alClic}>
        {children}
        <span className={`th-ordenable-flecha${activa ? ' th-ordenable-flecha-activa' : ''}`}>
          {activa ? (direccion === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
