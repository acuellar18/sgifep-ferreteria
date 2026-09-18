// Paginación reutilizable: cualquier módulo (Usuarios, y luego Roles,
// Departamentos, Inventario, etc.) la usa igual, pasándole solo el estado
// de paginación y un callback para cambiar de página.
//
// Uso:
//   <Paginacion pagina={page} totalPaginas={totalPaginas} onCambiar={setPagina} />
export default function Paginacion({ pagina, totalPaginas, total, onCambiar }) {
  if (!totalPaginas || totalPaginas <= 1) return null;

  // Ventana de números de página alrededor de la página actual (máx. 5),
  // para no imprimir 1..N completo cuando hay muchas páginas.
  const ventana = 5;
  let inicio = Math.max(1, pagina - Math.floor(ventana / 2));
  let fin = Math.min(totalPaginas, inicio + ventana - 1);
  inicio = Math.max(1, fin - ventana + 1);
  const numeros = [];
  for (let n = inicio; n <= fin; n += 1) numeros.push(n);

  return (
    <nav className="paginacion" aria-label="Paginación">
      {typeof total === 'number' && (
        <span className="paginacion-info">
          {total} {total === 1 ? 'registro' : 'registros'} · página {pagina} de {totalPaginas}
        </span>
      )}
      <div className="paginacion-controles">
        <button
          type="button"
          className="btn btn-opcion"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        >
          ‹ Anterior
        </button>

        {inicio > 1 && (
          <>
            <button type="button" className="btn btn-opcion" onClick={() => onCambiar(1)}>1</button>
            {inicio > 2 && <span className="paginacion-puntos">…</span>}
          </>
        )}

        {numeros.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn btn-opcion${n === pagina ? ' paginacion-activa' : ''}`}
            onClick={() => onCambiar(n)}
            aria-current={n === pagina ? 'page' : undefined}
          >
            {n}
          </button>
        ))}

        {fin < totalPaginas && (
          <>
            {fin < totalPaginas - 1 && <span className="paginacion-puntos">…</span>}
            <button type="button" className="btn btn-opcion" onClick={() => onCambiar(totalPaginas)}>
              {totalPaginas}
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-opcion"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente ›
        </button>
      </div>
    </nav>
  );
}
