import { useEffect } from 'react';

function LogoEmpresa({ empresa, className = '' }) {
  if (!empresa?.logo_url) return null;
  return <img src={empresa.logo_url} alt={empresa.nombre || 'Logo'} className={className} />;
}

export default function PrintLayout({
  empresa,
  titulo,
  subtitulo,
  orientacion = 'portrait',
  paginas,
  children,
  nombreArchivo = 'documento'
}) {
  const contenido = paginas?.length ? paginas : [children];

  useEffect(() => {
    const anterior = document.title;
    document.title = nombreArchivo;
    document.body.classList.add('print-body');
    return () => {
      document.title = anterior;
      document.body.classList.remove('print-body');
    };
  }, [nombreArchivo]);

  return (
    <div className={`print-documento print-${orientacion}`}>
      <style>{`@page { size: A4 ${orientacion}; margin: 0; }`}</style>
      <div className="print-toolbar no-print">
        <div>
          <strong>{titulo}</strong>
          {subtitulo && <span className="print-toolbar-subtitulo">{subtitulo}</span>}
        </div>
        <div className="print-toolbar-acciones">
          <button type="button" className="btn btn-secundario" onClick={() => window.close()}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primario" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="print-hojas">
        {contenido.map((pagina, indice) => (
          <section className="print-hoja" key={indice}>
            <div className="print-hoja-contenido">{pagina}</div>
            <footer className="print-pie">
              <span>{nombreArchivo}</span>
              <span>Página {indice + 1} de {contenido.length}</span>
            </footer>
          </section>
        ))}
      </div>
    </div>
  );
}

export { LogoEmpresa };
