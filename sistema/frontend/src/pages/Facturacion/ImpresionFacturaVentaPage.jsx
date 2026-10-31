import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import PrintLayout from '../../components/print/PrintLayout';
import { datosNegocio } from '../../config/negocio';
import {
  etiquetaEstadoPago,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  formatearNumero,
  formatearNumeroComprobante
} from '../../utils/formatos';

const FILAS_POR_PAGINA = 18;

function CabeceraEmpresa({ empresa, factura }) {
  const negocio = datosNegocio(empresa);
  return (
    <header className="print-encabezado">
      <div className="print-empresa">
        {negocio.logo_url && (
          <img src={negocio.logo_url} alt={negocio.nombre || 'Logo'} className="print-logo" />
        )}
        <div>
          <h1>{negocio.nombre}</h1>
          {negocio.nit && <p>NIT: {negocio.nit}</p>}
          {negocio.direccion && <p>{negocio.direccion}</p>}
          {(negocio.telefono || negocio.correo) && (
            <p>
              {negocio.telefono || ''}
              {negocio.telefono && negocio.correo ? ' · ' : ''}
              {negocio.correo || ''}
            </p>
          )}
        </div>
      </div>
      <div className="print-documento-titulo">
        <span className="print-etiqueta">COMPROBANTE</span>
        <strong>Comprobante de venta</strong>
        <span className="print-numero">{formatearNumeroComprobante(factura.numero)}</span>
      </div>
    </header>
  );
}

function TablaProductos({ detalles }) {
  return (
    <table className="print-tabla">
      <thead>
        <tr>
          <th>Código</th>
          <th>Producto / servicio</th>
          <th className="num">Cantidad</th>
          <th className="num">Precio unit.</th>
          <th className="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((detalle) => (
          <tr key={detalle.id}>
            <td>{detalle.producto_codigo}</td>
            <td>{detalle.producto_nombre}</td>
            <td className="num">
              {formatearNumero(detalle.cantidad, 3)} {detalle.unidad_medida}
            </td>
            <td className="num">{formatearMoneda(detalle.precio_unitario)}</td>
            <td className="num">{formatearMoneda(detalle.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResumenFactura({ factura }) {
  return (
    <div className="print-resumen-grid">
      <div className="print-pagos">
        <h3>Condiciones de pago</h3>
        <table className="print-tabla print-tabla-compacta">
          <tbody>
            <tr>
              <td>Condición</td>
              <td>{factura.condicion === 'credito' ? 'Crédito' : 'Contado'}</td>
            </tr>
            <tr>
              <td>Vencimiento</td>
              <td>{formatearFecha(factura.fecha_vencimiento)}</td>
            </tr>
            <tr>
              <td>Estado del pago</td>
              <td>
                {factura.estado === 'anulada'
                  ? 'Anulada'
                  : etiquetaEstadoPago(factura.estado_pago)}
              </td>
            </tr>
            <tr>
              <td>Monto pagado</td>
              <td className="num">{formatearMoneda(factura.monto_pagado)}</td>
            </tr>
            <tr>
              <td>Saldo pendiente</td>
              <td className="num">{formatearMoneda(factura.saldo_pendiente)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="print-totales">
        <div><span>Subtotal</span><strong>{formatearMoneda(factura.subtotal)}</strong></div>
        <div><span>IVA (12%)</span><strong>{formatearMoneda(factura.iva)}</strong></div>
        <div className="print-total-final"><span>Total</span><strong>{formatearMoneda(factura.total)}</strong></div>
        <div><span>Pagado</span><strong>{formatearMoneda(factura.monto_pagado)}</strong></div>
        <div><span>Saldo pendiente</span><strong>{formatearMoneda(factura.saldo_pendiente)}</strong></div>
      </div>
    </div>
  );
}

function PieFirma() {
  return (
    <div className="print-firmas">
      <div><span>Recibí conforme</span></div>
      <div><span>Vendedor</span></div>
    </div>
  );
}

export default function ImpresionFacturaVentaPage() {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api.get(`/facturas/${id}/impresion`)
      .then((res) => {
        if (activo) setDatos(res.data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => { activo = false; };
  }, [id]);

  if (error) return <div className="print-error">{error}</div>;
  if (!datos) return <div className="print-error">Cargando comprobante...</div>;

  const { empresa, factura } = datos;
  const numeroComprobante = formatearNumeroComprobante(factura.numero);
  const detalles = factura.detalles || [];
  const bloques = [];
  for (let i = 0; i < detalles.length; i += FILAS_POR_PAGINA) {
    bloques.push(detalles.slice(i, i + FILAS_POR_PAGINA));
  }
  if (!bloques.length) bloques.push([]);

  const paginas = bloques.map((filas, indice) => {
    const esPrimera = indice === 0;
    const esUltima = indice === bloques.length - 1;
    return (
      <div className="print-contenido-factura" key={indice}>
        {factura.estado === 'anulada' && <div className="print-marca-anulada">ANULADA</div>}
        {esPrimera ? (
          <>
            <CabeceraEmpresa empresa={empresa} factura={factura} />
            <div className="print-datos-grid">
              <div>
                <h3>Cliente</h3>
                <p><strong>{factura.cliente_nombre}</strong></p>
                <p>NIT: {factura.cliente_nit}</p>
                {factura.cliente_telefono && <p>Teléfono: {factura.cliente_telefono}</p>}
                {factura.cliente_correo && <p>Correo: {factura.cliente_correo}</p>}
                {factura.cliente_direccion && <p>{factura.cliente_direccion}</p>}
              </div>
              <div>
                <h3>Datos del comprobante</h3>
                <p><span>Fecha:</span> {formatearFecha(factura.fecha)}</p>
                <p><span>Condición:</span> {factura.condicion === 'credito' ? 'Crédito' : 'Contado'}</p>
                <p><span>Vence:</span> {formatearFecha(factura.fecha_vencimiento)}</p>
                <p><span>Estado:</span> {factura.estado === 'anulada' ? 'Anulada' : 'Emitida'}</p>
                <p>
                  <span>Estado de pago:</span>{' '}
                  {factura.estado === 'anulada'
                    ? 'Anulada'
                    : etiquetaEstadoPago(factura.estado_pago)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="print-continuacion">
            <strong>{empresa?.nombre}</strong>
            <span>Comprobante de venta {formatearNumeroComprobante(factura.numero)}</span>
          </div>
        )}

        <TablaProductos detalles={filas} />

        {esUltima && (
          <>
            <ResumenFactura factura={factura} />
            {factura.notas && (
              <div className="print-notas">
                <h3>Notas</h3>
                <p>{factura.notas}</p>
              </div>
            )}
            {factura.estado === 'anulada' && (
              <div className="print-notas print-notas-anulada">
                <h3>Anulación</h3>
                <p>Motivo: {factura.anulacion_motivo || '—'}</p>
                <p>
                  Anulada el {formatearFechaHora(factura.anulada_en)}
                  {factura.anulada_por_nombre ? ` por ${factura.anulada_por_nombre}` : ''}
                </p>
              </div>
            )}
            <div className="print-meta">
              <span>Emitida por {factura.usuario_nombre || '—'}</span>
              <span>Generado el {formatearFechaHora(new Date())}</span>
            </div>
            <div className="print-nota-interna">
              <p>Comprobante de venta interno · No válido como factura</p>
              <p>Sistema SGIFEP · Desarrollado por Anthony Cuellar</p>
            </div>
            <PieFirma />
          </>
        )}
      </div>
    );
  });

  return (
    <PrintLayout
      empresa={empresa}
      titulo={`Comprobante de venta ${numeroComprobante}`}
      subtitulo={factura.cliente_nombre}
      nombreArchivo={`comprobante-${numeroComprobante}.pdf`}
      paginas={paginas}
    />
  );
}
