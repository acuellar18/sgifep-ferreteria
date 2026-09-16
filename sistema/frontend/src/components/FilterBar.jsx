// Barra de filtros del listado de usuarios.
// Una sola caja de búsqueda + selects de estado/departamento/rol + rango de fechas.
export default function FilterBar({ filtros, departamentos, roles, onChange, onFiltrar, onLimpiar }) {
  return (
    <form className="filterbar" onSubmit={onFiltrar}>
      <input
        type="text"
        className="control"
        placeholder="Buscar por nombre, apellido, código o usuario..."
        value={filtros.q || ''}
        onChange={(e) => onChange({ ...filtros, q: e.target.value })}
      />
      <select
        className="control"
        value={filtros.estado || 'todos'}
        onChange={(e) => onChange({ ...filtros, estado: e.target.value })}
      >
        <option value="todos">Estado: todos</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
      <select
        className="control"
        value={filtros.departamento || ''}
        onChange={(e) => onChange({ ...filtros, departamento: e.target.value })}
      >
        <option value="">Departamento: todos</option>
        {departamentos.map((d) => (
          <option key={d.id} value={d.id}>{d.nombre}</option>
        ))}
      </select>
      <select
        className="control"
        value={filtros.rol || ''}
        onChange={(e) => onChange({ ...filtros, rol: e.target.value })}
      >
        <option value="">Rol: todos</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
      <input
        type="date"
        className="control"
        title="Desde (fecha de creación)"
        value={filtros.startDate || ''}
        onChange={(e) => onChange({ ...filtros, startDate: e.target.value })}
      />
      <input
        type="date"
        className="control"
        title="Hasta (fecha de creación)"
        value={filtros.endDate || ''}
        onChange={(e) => onChange({ ...filtros, endDate: e.target.value })}
      />
      <button type="submit" className="btn btn-primario">Filtrar</button>
      <button type="button" className="btn btn-secundario" onClick={onLimpiar}>Limpiar</button>
    </form>
  );
}