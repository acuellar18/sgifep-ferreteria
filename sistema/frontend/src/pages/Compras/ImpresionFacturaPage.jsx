import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import PrintLayout from '../../components/print/PrintLayout';
import {
  etiquetaEstadoPago,
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  formatearNumero
} from '../../utils/formatos';

const FILAS_POR_PAGINA = 18;

function CabeceraEmpresa({ empresa, compra }) {
  return (
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
            <p>
              {empresa.telefono || ''}
              {empresa.telefono && empresa.correo ? ' · ' : ''}
              {empresa.correo || ''}
            </p>
          )}
        </div>
      </div>
      <div className="print-documento-titulo">
        <span className="print-etiqueta">DOCUMENTO</span>
        <strong>Factura de compra</strong>
        <span className="print-numero">{compra.numero}</span>
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
          <th>Producto</th>
          <th className="num">Cantidad</th>
          <th className="num">Costo unit.</th>
          <th className="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((d) => (
          <tr key={d.id}>
            <td>{d.producto_codigo}</td>
            <td>{d.producto_nombre}</td>
            <td className="num">{formatearNumero(d.cantidad, 2)} {d.unidad_medida}</td>
            <td className="num">{formatearMoneda(d.costo_unitario)}</td>
            <td className="num">{formatearMoneda(d.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResumenCompra({ compra }) {
  return (
    <div className="print-resumen-grid">
      <div className="print-pagos">
        <h3>Pagos registrados</h3>
        {compra.pagos?.length ? (
          <table className="print-tabla print-tabla-compacta">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Método</th>
                <th>Referencia</th>
                <th className="num">Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {compra.pagos.map((p) => (
                <tr key={p.id}>
                  <td>{formatearFecha(p.fecha)}</td>
                  <td>{p.metodo}</td>
                  <td>{p.referencia || '—'}</td>
                  <td className="num">{formatearMoneda(p.monto)}</td>
                  <td>{p.estado === 'anulado' ? 'Anulado' : 'Activo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="print-vacio">Sin pagos registrados.</p>
        )}
      </div>
      <div className="print-totales">
        <div><span>Subtotal</span><strong>{formatearMoneda(compra.subtotal)}</strong></div>
        <div><span>IVA (12%)</span><strong>{formatearMoneda(compra.iva)}</strong></div>
        <div className="print-total-final"><span>Total</span><strong>{formatearMoneda(compra.total)}</strong></div>
        <div><span>Pagado</span><strong>{formatearMoneda(compra.monto_pagado)}</strong></div>
        <div><span>Saldo pendiente</span><strong>{formatearMoneda(compra.saldo_pendiente)}</strong></div>
      </div>
    </div>
  );
}

function PieFirma() {
  return (
    <div className="print-firmas">
      <div><span>Recibido por</span></div>
      <div><span>Autorizado por</span></div>
    </div>
  );
}

export default function ImpresionFacturaPage() {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api.get(`/compras/${id}/impresion`)
      .then((res) => {
        if (activo) setDatos(res.data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => { activo = false; };
  }, [id]);

  if (error) return <div className="print-error">{error}</div>;
  if (!datos) return <div className="print-error">Cargando factura...</div>;

  const { empresa, compra } = datos;
  const detalles = compra.detalles || [];
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
        {compra.estado === 'anulada' && (
          <div className="print-marca-anulada">ANULADA</div>
        )}
        {esPrimera ? (
          <>
            <CabeceraEmpresa empresa={empresa} compra={compra} />
            <div className="print-datos-grid">
              <div>
                <h3>Proveedor</h3>
                <p><strong>{compra.proveedor?.nombre}</strong></p>
                {compra.proveedor?.nit && <p>NIT: {compra.proveedor.nit}</p>}
                {compra.proveedor?.dpi && <p>DPI: {compra.proveedor.dpi}</p>}
                {compra.proveedor?.contacto_nombre && <p>Contacto: {compra.proveedor.contacto_nombre}</p>}
                {compra.proveedor?.telefono && <p>Teléfono: {compra.proveedor.telefono}</p>}
                {compra.proveedor?.telefono2 && <p>Teléfono alterno: {compra.proveedor.telefono2}</p>}
                {compra.proveedor?.correo && <p>Correo: {compra.proveedor.correo}</p>}
                {compra.proveedor?.direccion && <p>{compra.proveedor.direccion}</p>}
              </div>
              <div>
                <h3>Datos de la factura</h3>
                <p><span>Fecha:</span> {formatearFecha(compra.fecha)}</p>
                <p><span>Serie:</span> {compra.serie || '—'}</p>
                <p><span>No. factura:</span> {compra.numero_factura || '—'}</p>
                <p><span>Condición:</span> {compra.condicion === 'credito' ? 'Crédito' : 'Contado'}</p>
                <p><span>Vence:</span> {formatearFecha(compra.fecha_vencimiento)}</p>
                <p><span>Estado de pago:</span> {etiquetaEstadoPago(compra.estado_pago)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="print-continuacion">
            <strong>{empresa?.nombre}</strong>
            <span>Factura de compra {compra.numero}</span>
          </div>
        )}

        <TablaProductos detalles={filas} />

        {esUltima && (
          <>
            <ResumenCompra compra={compra} />
            {compra.notas && (
              <div className="print-notas">
                <h3>Notas</h3>
                <p>{compra.notas}</p>
              </div>
            )}
            {compra.estado === 'anulada' && (
              <div className="print-notas print-notas-anulada">
                <h3>Anulación</h3>
                <p>Motivo: {compra.anulacion_motivo || '—'}</p>
                <p>
                  Anulada el {formatearFechaHora(compra.anulada_en)}
                  {compra.anulada_por_nombre ? ` por ${compra.anulada_por_nombre}` : ''}
                </p>
              </div>
            )}
            <div className="print-meta">
              <span>Registrado por {compra.usuario_nombre || '—'}</span>
              <span>Generado el {formatearFechaHora(new Date())}</span>
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
      titulo={`Factura de compra ${compra.numero}`}
      subtitulo={compra.proveedor?.nombre}
      nombreArchivo={`compra-${compra.numero}.pdf`}
      paginas={paginas}
    />
  );
}
