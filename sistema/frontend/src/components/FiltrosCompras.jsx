export default function FiltrosCompras({
  filtros,
  onChange,
  onFiltrar,
  onLimpiar,
  placeholder = 'Buscar por número, factura o proveedor...',
  children
}) {
  return (
    <form className="filterbar" onSubmit={onFiltrar}>
      <input
        type="text"
        className="control"
        placeholder={placeholder}
        value={filtros.q || ''}
        onChange={(e) => onChange({ ...filtros, q: e.target.value })}
      />
      {children}
      <button type="submit" className="btn btn-primario">Filtrar</button>
      <button type="button" className="btn btn-secundario" onClick={onLimpiar}>Limpiar</button>
    </form>
  );
}
