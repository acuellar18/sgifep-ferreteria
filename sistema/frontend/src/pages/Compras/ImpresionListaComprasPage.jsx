import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PrintLayout from '../../components/print/PrintLayout';
import {
  etiquetaEstado,
  etiquetaEstadoPago,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda
} from '../../utils/formatos';

const FILAS_POR_PAGINA = 22;

function CabeceraLista({ empresa, total, filtros }) {
  return (
    <>
      <header className="print-encabezado">
        <div className="print-empresa">
          {empresa?.logo_url && (
            <img src={empresa.logo_url} alt={empresa.nombre || 'Logo'} className="print-logo" />
          )}
          <div>
            <h1>{empresa?.nombre || 'Ferretería El Puente'}</h1>
            {empresa?.nit && <p>NIT: {empresa.nit}</p>}
            {empresa?.direccion && <p>{empresa.direccion}</p>}
            {(empresa?.telefono || empresa?.correo) && (
              <p>{[empresa.telefono, empresa.correo].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>
        <div className="print-documento-titulo">
          <span className="print-etiqueta">REPORTE</span>
          <strong>Listado de compras</strong>
          <span className="print-numero">{total} registros</span>
        </div>
      </header>
      <div className="print-filtros">
        <strong>Filtros:</strong>{' '}
        {filtros?.length ? filtros.join(' · ') : 'Sin filtros (todas las compras)'}
      </div>
    </>
  );
}

function TablaCompras({ compras, continuacion }) {
  return (
    <table className="print-tabla print-tabla-lista">
      <thead>
        <tr>
          {continuacion && <th colSpan={10} className="print-continuacion-celda">Continuación del listado</th>}
        </tr>
        <tr>
          <th>No. compra</th>
          <th>Fecha</th>
          <th>Proveedor</th>
          <th>NIT</th>
          <th>Factura</th>
          <th>Condición</th>
          <th>Vence</th>
          <th className="num">Total</th>
          <th className="num">Saldo</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {compras.map((c) => (
          <tr key={c.id}>
            <td>{c.numero}</td>
            <td>{formatearFecha(c.fecha)}</td>
            <td>{c.proveedor_nombre}</td>
            <td>{c.proveedor_nit || '—'}</td>
            <td>{[c.serie, c.numero_factura].filter(Boolean).join('-') || '—'}</td>
            <td>{c.condicion === 'credito' ? 'Crédito' : 'Contado'}</td>
            <td>{formatearFecha(c.fecha_vencimiento)}</td>
            <td className="num">{formatearMoneda(c.total)}</td>
            <td className="num">{formatearMoneda(c.saldo_pendiente)}</td>
            <td>{etiquetaEstado(c.estado)} / {etiquetaEstadoPago(c.estado_pago)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totales({ totales }) {
  return (
    <div className="print-totales print-totales-lista">
      <div><span>Total facturado</span><strong>{formatearMoneda(totales.total)}</strong></div>
      <div><span>Total pagado</span><strong>{formatearMoneda(totales.pagado)}</strong></div>
      <div className="print-total-final"><span>Saldo pendiente</span><strong>{formatearMoneda(totales.saldo)}</strong></div>
    </div>
  );
}

export default function ImpresionListaComprasPage() {
  const [searchParams] = useSearchParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const params = Object.fromEntries(searchParams.entries());
    api.get('/compras/impresion/lista', { params })
      .then((res) => {
        if (activo) setDatos(res.data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => { activo = false; };
  }, [searchParams]);

  if (error) return <div className="print-error">{error}</div>;
  if (!datos) return <div className="print-error">Preparando listado...</div>;

  const { empresa, compras, total, filtros_texto, totales, generado_en } = datos;
  const bloques = [];
  for (let i = 0; i < compras.length; i += FILAS_POR_PAGINA) {
    bloques.push(compras.slice(i, i + FILAS_POR_PAGINA));
  }
  if (!bloques.length) bloques.push([]);

  const paginas = bloques.map((filas, indice) => {
    const esPrimera = indice === 0;
    const esUltima = indice === bloques.length - 1;
    return (
      <div className="print-contenido-lista" key={indice}>
        {esPrimera && <CabeceraLista empresa={empresa} total={total} filtros={filtros_texto} />}
        <TablaCompras compras={filas} continuacion={!esPrimera} />
        {esUltima && (
          <>
            <Totales totales={totales} />
            <div className="print-meta">
              <span>Registros: {total}</span>
              <span>Generado el {formatearFechaHora(generado_en)}</span>
            </div>
          </>
        )}
      </div>
    );
  });

  return (
    <PrintLayout
      empresa={empresa}
      titulo="Listado de compras"
      subtitulo={`${total} registros`}
      orientacion="landscape"
      nombreArchivo="listado-compras.pdf"
      paginas={paginas}
    />
  );
}
