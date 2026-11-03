import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function LogoEmpresa({ empresa, className = '' }) {
  if (!empresa?.logo_url) return null;
  return <img src={empresa.logo_url} alt={empresa.nombre || 'Logo'} className={className} />;
}

function dimensionesPagina(tamano, orientacion) {
  const base = String(tamano).toLowerCase() === 'letter'
    ? { ancho: 215.9, alto: 279.4 }
    : { ancho: 210, alto: 297 };
  if (orientacion === 'landscape') {
    return { ancho: base.alto, alto: base.ancho };
  }
  return base;
}

export default function PrintLayout({
  empresa,
  titulo,
  subtitulo,
  orientacion = 'portrait',
  tamano = 'A4',
  paginas,
  children,
  nombreArchivo = 'documento'
}) {
  const contenido = paginas?.length ? paginas : [children];
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState('');

  useEffect(() => {
    const anterior = document.title;
    document.title = nombreArchivo;
    document.body.classList.add('print-body');
    return () => {
      document.title = anterior;
      document.body.classList.remove('print-body');
    };
  }, [nombreArchivo]);

  async function descargarPDF() {
    const hojas = Array.from(document.querySelectorAll('.print-hoja'));
    if (!hojas.length) return;
    setGenerandoPDF(true);
    setErrorPDF('');
    try {
      const { ancho, alto } = dimensionesPagina(tamano, orientacion);
      const doc = new jsPDF({
        orientation: orientacion,
        unit: 'mm',
        format: [ancho, alto]
      });
      for (let i = 0; i < hojas.length; i += 1) {
        const canvas = await html2canvas(hojas[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const datos = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) doc.addPage([ancho, alto], orientacion);
        doc.addImage(datos, 'JPEG', 0, 0, ancho, alto);
      }
      doc.save(nombreArchivo);
    } catch (err) {
      setErrorPDF(err?.message || 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  }

  return (
    <div className={`print-documento print-${orientacion} print-tamano-${tamano.toLowerCase()}`}>
      <style>{`@page { size: ${tamano} ${orientacion}; margin: 0; }`}</style>
      <div className="print-toolbar no-print">
        <div>
          <strong>{titulo}</strong>
          {subtitulo && <span className="print-toolbar-subtitulo">{subtitulo}</span>}
        </div>
        <div className="print-toolbar-acciones">
          {errorPDF && <span className="print-toolbar-error">{errorPDF}</span>}
          <button type="button" className="btn btn-secundario" onClick={() => window.close()}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={descargarPDF}
            disabled={generandoPDF}
          >
            {generandoPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button type="button" className="btn btn-primario" onClick={() => window.print()}>
            Imprimir
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