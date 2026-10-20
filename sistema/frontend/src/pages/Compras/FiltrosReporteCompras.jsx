export default function FiltrosReporteCompras({
  filtros,
  proveedores,
  categorias,
  onChange,
  onFiltrar,
  onLimpiar,
  onAtajo
}) {
  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor });
  }

  return (
    <form className="reporte-filtros" onSubmit={onFiltrar}>
      <div className="reporte-filtros-grid">
        <label className="reporte-campo">
          <span>Desde</span>
          <input
            type="date"
            className="control"
            value={filtros.startDate || ''}
            onChange={(e) => actualizar('startDate', e.target.value)}
          />
        </label>

        <label className="reporte-campo">
          <span>Hasta</span>
          <input
            type="date"
            className="control"
            value={filtros.endDate || ''}
            onChange={(e) => actualizar('endDate', e.target.value)}
          />
        </label>

        <label className="reporte-campo">
          <span>Proveedor</span>
          <select
            className="control"
            value={filtros.proveedor || ''}
            onChange={(e) => actualizar('proveedor', e.target.value)}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
            ))}
          </select>
        </label>

        <label className="reporte-campo">
          <span>Categoría</span>
          <select
            className="control"
            value={filtros.categoria || ''}
            onChange={(e) => actualizar('categoria', e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="reporte-filtros-pie">
        <div className="reporte-atajos">
          <span>Períodos rápidos:</span>
          <button type="button" className="reporte-atajo" onClick={() => onAtajo(0)}>Hoy</button>
          <button type="button" className="reporte-atajo" onClick={() => onAtajo(6)}>Últimos 7 días</button>
          <button type="button" className="reporte-atajo" onClick={() => onAtajo(29)}>Últimos 30 días</button>
          <button type="button" className="reporte-atajo" onClick={() => onAtajo(364)}>Últimos 12 meses</button>
        </div>
        <div className="reporte-filtros-acciones">
          <button type="button" className="btn btn-secundario" onClick={onLimpiar}>Limpiar</button>
          <button type="submit" className="btn btn-primario">Aplicar filtros</button>
        </div>
      </div>
    </form>
  );
}
