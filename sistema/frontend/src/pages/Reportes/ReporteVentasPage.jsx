import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import { formatearFechaHora, formatearMoneda } from '../../utils/formatos';

function fechaLocal(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function filtrosIniciales() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return {
    desde: fechaLocal(inicio),
    hasta: fechaLocal(hoy),
    metodo_pago: '',
    cajero: ''
  };
}

const RESUMEN_INICIAL = {
  ventas_count: 0,
  ventas_total: 0,
  ticket_promedio: 0,
  efectivo: 0,
  tarjeta: 0,
  transferencia: 0,
  anuladas_count: 0,
  anuladas_total: 0,
  devoluciones_count: 0,
  devoluciones_total: 0,
  devoluciones_efectivo: 0,
  neto: 0
};

const ETIQUETAS_METODO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia'
};

export default function ReporteVentasPage() {
  const notificar = useNotificacion();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [aplicados, setAplicados] = useState(filtrosIniciales);
  const [data, setData] = useState({
    resumen: RESUMEN_INICIAL,
    por_dia: [],
    por_metodo: [],
    por_cajero: [],
    top_productos: [],
    ultimas: []
  });
  const [cajeros, setCajeros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async (filtrosActuales) => {
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor) params[clave] = valor;
      }
      const res = await api.get('/reportes-ventas/resumen', { params });
      setData({
        resumen: { ...RESUMEN_INICIAL, ...(res.data?.resumen || {}) },
        por_dia: res.data?.por_dia || [],
        por_metodo: res.data?.por_metodo || [],
        por_cajero: res.data?.por_cajero || [],
        top_productos: res.data?.top_productos || [],
        ultimas: res.data?.ultimas || []
      });
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(aplicados);
  }, [aplicados, cargar]);

  useEffect(() => {
    async function cargarCajeros() {
      try {
        const res = await api.get('/reportes-ventas/cajeros');
        setCajeros(res.data || []);
      } catch {
        setCajeros([]);
      }
    }
    cargarCajeros();
  }, []);

  function cambiar(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicar(evento) {
    evento.preventDefault();
    if (filtros.desde > filtros.hasta) {
      notificar.error('La fecha inicial no puede ser mayor que la final');
      return;
    }
    setAplicados({ ...filtros });
  }

  function limpiar() {
    const nuevos = filtrosIniciales();
    setFiltros(nuevos);
    setAplicados(nuevos);
  }

  const filasResumen = () => [
    { Indicador: 'Ventas', Valor: data.resumen.ventas_count },
    { Indicador: 'Total vendido', Valor: data.resumen.ventas_total },
    { Indicador: 'Ticket promedio', Valor: data.resumen.ticket_promedio },
    { Indicador: 'Efectivo', Valor: data.resumen.efectivo },
    { Indicador: 'Tarjeta', Valor: data.resumen.tarjeta },
    { Indicador: 'Transferencia', Valor: data.resumen.transferencia },
    { Indicador: 'Anuladas', Valor: data.resumen.anuladas_count },
    { Indicador: 'Total anulado', Valor: data.resumen.anuladas_total },
    { Indicador: 'Devoluciones', Valor: data.resumen.devoluciones_count },
    { Indicador: 'Total devuelto', Valor: data.resumen.devoluciones_total },
    { Indicador: 'Neto', Valor: data.resumen.neto }
  ];

  function exportarExcel() {
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(filasResumen()),
      'Resumen'
    );
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(
        data.por_dia.map((dia) => ({
          Fecha: dia.fecha,
          Ventas: dia.ventas_count,
          Total: dia.total,
          Efectivo: dia.efectivo,
          Tarjeta: dia.tarjeta,
          Transferencia: dia.transferencia
        }))
      ),
      'Por día'
    );
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(
        data.top_productos.map((producto) => ({
          Código: producto.producto_codigo,
          Producto: producto.producto_nombre,
          Cantidad: producto.cantidad,
          Total: producto.total
        }))
      ),
      'Top productos'
    );
    XLSX.writeFile(libro, `reporte-ventas-${aplicados.desde}-${aplicados.hasta}.xlsx`);
    notificar.exito('Reporte exportado en Excel');
  }

  async function exportarPdf() {
    const doc = new jsPDF();
    const AP = 210;

    let logoB64 = null;
    try {
      const r = await fetch('/img/logo.png');
      const b = await r.arrayBuffer();
      const u = new Uint8Array(b);
      let s = '';
      u.forEach(v => s += String.fromCharCode(v));
      logoB64 = `data:image/png;base64,${btoa(s)}`;
    } catch {}

    if (logoB64) doc.addImage(logoB64, 'PNG', 12, 4, 22, 14);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.text('Ferretería El Puente', logoB64 ? 38 : 14, 14);
    doc.setFontSize(9);
    doc.text('SGIFEP — Sistema de Gestión Integral', logoB64 ? 38 : 14, 21);

    const tx = AP - 68;
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(255, 255, 255);
    doc.rect(tx, 4, 60, 20, 'DF');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.text('REPORTE', tx + 5, 10);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.text('Ventas', tx + 5, 17);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(`Del ${aplicados.desde} al ${aplicados.hasta}`, tx + 5, 23);

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(12, 36, AP - 12, 36);
    doc.setLineWidth(0.1);

    let y = 42;

    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: filasResumen().map((fila) => [fila.Indicador, String(fila.Valor)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 1: { halign: 'right' } }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Fecha', 'Ventas', 'Total', 'Efectivo', 'Tarjeta', 'Transferencia']],
      body: data.por_dia.map((dia) => [
        dia.fecha,
        String(dia.ventas_count),
        formatearMoneda(dia.total),
        formatearMoneda(dia.efectivo),
        formatearMoneda(dia.tarjeta),
        formatearMoneda(dia.transferencia)
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    const fy = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    const ahora = new Date();
    doc.text(`Generado el ${ahora.toLocaleDateString('es-GT')}, ${ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`, 14, fy);

    doc.save(`reporte-ventas-${aplicados.desde}-${aplicados.hasta}.pdf`);
    notificar.exito('Reporte exportado en PDF');
  }

  function exportarCsv() {
    const filas = data.por_dia.map((dia) => ({
      Fecha: dia.fecha,
      Ventas: dia.ventas_count,
      Total: dia.total,
      Efectivo: dia.efectivo,
      Tarjeta: dia.tarjeta,
      Transferencia: dia.transferencia
    }));
    if (exportarCSV(filas, `reporte-ventas-${aplicados.desde}-${aplicados.hasta}.csv`)) {
      notificar.exito('Reporte exportado en CSV');
    } else {
      notificar.error('No hay datos para exportar');
    }
  }

function imprimirReporte() {
    const resumen = filasResumen().map(r => `<tr><td>${r.Indicador}</td><td class="num">${formatearMoneda(r.Valor)}</td></tr>`).join('');
    const filas = data.por_dia.map(d => `<tr><td>${d.fecha}</td><td class="num">${d.ventas_count}</td><td class="num">${formatearMoneda(d.total)}</td><td class="num">${formatearMoneda(d.efectivo)}</td><td class="num">${formatearMoneda(d.tarjeta)}</td><td class="num">${formatearMoneda(d.transferencia)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte de Ventas</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Segoe UI',Tahoma,sans-serif;color:#111827;background:#fff;padding:12mm}
.print-encabezado{display:flex;align-items:flex-start;justify-content:space-between;gap:12mm;padding-bottom:5mm;border-bottom:2px solid #16a34a}
.print-empresa h1{margin:0 0 1.5mm;font-size:16pt;color:#111827}
.print-empresa p{margin:0.8mm 0;font-size:9pt;color:#374151}
.print-documento-titulo{min-width:52mm;padding:3mm 5mm;text-align:right;border:1px solid #d1d5db;border-radius:3px}
.print-etiqueta{display:block;color:#16a34a;font-size:7.5pt;font-weight:700;letter-spacing:0.08em}
.print-documento-titulo strong{display:block;margin:1mm 0;font-size:13pt}
.print-numero{font-size:10pt;font-weight:600}
.print-filtros{margin:4mm 0 0;padding:2mm 3mm;background:#f8f9fa;border-left:3px solid #16a34a;font-size:8.5pt}
h2.print-seccion{margin:5mm 0 2mm;color:#16a34a;font-size:9.5pt;text-transform:uppercase;letter-spacing:0.04em}
.print-tabla{width:100%;border-collapse:collapse;font-size:8.8pt}
.print-tabla th{padding:2mm;background:#141414;color:#fff;text-align:left;font-size:8pt;text-transform:uppercase;letter-spacing:0.03em}
.print-tabla td{padding:1.8mm 2mm;border-bottom:1px solid #e5e7eb}
.print-tabla tbody tr:nth-child(even) td{background:#f8f9fa}
.print-tabla .num{text-align:right;white-space:nowrap}
.print-meta{display:flex;justify-content:space-between;margin-top:6mm;color:#6b7280;font-size:8pt}
@media print{@page{margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="print-encabezado"><div><h1>Ferretería El Puente</h1><p>SGIFEP — Sistema de Gestión Integral</p></div>
<div class="print-documento-titulo"><span class="print-etiqueta">REPORTE</span><strong>Ventas</strong><span class="print-numero">Del ${aplicados.desde} al ${aplicados.hasta}</span></div></div>
<div class="print-filtros"><strong>Filtros:</strong> Del ${aplicados.desde} al ${aplicados.hasta}</div>
<h2 class="print-seccion">Resumen</h2>
<table class="print-tabla"><thead><tr><th>Indicador</th><th class="num">Valor</th></tr></thead><tbody>${resumen}</tbody></table>
<h2 class="print-seccion">Ventas por d&iacute;a</h2>
<table class="print-tabla"><thead><tr><th>Fecha</th><th class="num">Ventas</th><th class="num">Total</th><th class="num">Efectivo</th><th class="num">Tarjeta</th><th class="num">Transferencia</th></tr></thead><tbody>${filas}</tbody></table>
<div class="print-meta"><span>Registros: ${data.por_dia.length} d&iacute;as</span><span>Generado el ${new Date().toLocaleString('es-GT')}</span></div>
</body></html>`;
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) setTimeout(() => URL.revokeObjectURL(url), 1000);
      else notificar.error('Permite la ventana emergente');
    } catch { notificar.error('No se pudo abrir la ventana'); }
  }

  return (
    <section className="reporte-ventas">
      <header className="reporte-ventas-encabezado">
        <div>
          <h2>Reporte de ventas</h2>
          <p>Indicadores del POS, métodos de pago, devoluciones y desempeño por cajero.</p>
        </div>
        <div className="reporte-acciones">
          <button type="button" className="btn btn-secundario" onClick={exportarCsv}>CSV</button>
          <button type="button" className="btn btn-secundario" onClick={exportarExcel}>Excel</button>
          <button type="button" className="btn btn-secundario" onClick={exportarPdf}>PDF</button>
          <button type="button" className="btn btn-primario" onClick={imprimirReporte}>Imprimir</button>
        </div>
      </header>

      <form className="reporte-filtros" onSubmit={aplicar}>
        <label className="campo">
          <span>Desde</span>
          <input
            type="date"
            className="control"
            value={filtros.desde}
            onChange={(e) => cambiar('desde', e.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Hasta</span>
          <input
            type="date"
            className="control"
            value={filtros.hasta}
            onChange={(e) => cambiar('hasta', e.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Método de pago</span>
          <select
            className="control"
            value={filtros.metodo_pago}
            onChange={(e) => cambiar('metodo_pago', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label className="campo">
          <span>Cajero</span>
          <select
            className="control"
            value={filtros.cajero}
            onChange={(e) => cambiar('cajero', e.target.value)}
          >
            <option value="">Todos</option>
            {cajeros.map((cajero) => (
              <option key={cajero.usuario_id} value={cajero.usuario_id}>
                {cajero.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="reporte-filtros-acciones">
          <button type="submit" className="btn btn-primario">Aplicar</button>
          <button type="button" className="btn btn-secundario" onClick={limpiar}>Mes actual</button>
        </div>
      </form>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="reporte-resumen">
        <article>
          <span>Total vendido</span>
          <strong>{formatearMoneda(data.resumen.ventas_total)}</strong>
          <small>{data.resumen.ventas_count} ventas</small>
        </article>
        <article>
          <span>Ticket promedio</span>
          <strong>{formatearMoneda(data.resumen.ticket_promedio)}</strong>
          <small>Por venta completada</small>
        </article>
        <article>
          <span>Devoluciones</span>
          <strong>{formatearMoneda(data.resumen.devoluciones_total)}</strong>
          <small>{data.resumen.devoluciones_count} registros</small>
        </article>
        <article>
          <span>Neto</span>
          <strong>{formatearMoneda(data.resumen.neto)}</strong>
          <small>Ventas menos devoluciones</small>
        </article>
      </div>

      <div className="reporte-grid">
        <div className="reporte-panel">
          <h3>Ventas por día</h3>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Total</th>
                  <th>Efectivo</th>
                  <th>Tarjeta</th>
                  <th>Transferencia</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="6" className="tabla-vacia">Cargando...</td></tr>
                ) : data.por_dia.length === 0 ? (
                  <tr><td colSpan="6" className="tabla-vacia">Sin ventas en el período.</td></tr>
                ) : (
                  data.por_dia.map((dia) => (
                    <tr key={dia.fecha}>
                      <td>{dia.fecha}</td>
                      <td>{dia.ventas_count}</td>
                      <td>{formatearMoneda(dia.total)}</td>
                      <td>{formatearMoneda(dia.efectivo)}</td>
                      <td>{formatearMoneda(dia.tarjeta)}</td>
                      <td>{formatearMoneda(dia.transferencia)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reporte-panel">
          <h3>Métodos de pago</h3>
          <div className="reporte-barras">
            {data.por_metodo.length === 0 ? (
              <p className="tabla-vacia">Sin datos.</p>
            ) : (
              data.por_metodo.map((metodo) => {
                const maximo = Math.max(...data.por_metodo.map((item) => item.total), 1);
                return (
                  <div key={metodo.metodo_pago} className="reporte-barra">
                    <div className="reporte-barra-texto">
                      <span>{ETIQUETAS_METODO[metodo.metodo_pago] || metodo.metodo_pago}</span>
                      <strong>{formatearMoneda(metodo.total)}</strong>
                    </div>
                    <div className="reporte-barra-fondo">
                      <div style={{ width: `${Math.max(4, (metodo.total / maximo) * 100)}%` }} />
                    </div>
                    <small>{metodo.ventas_count} ventas</small>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="reporte-panel">
          <h3>Top productos</h3>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr>
              </thead>
              <tbody>
                {data.top_productos.length === 0 ? (
                  <tr><td colSpan="3" className="tabla-vacia">Sin datos.</td></tr>
                ) : (
                  data.top_productos.map((producto) => (
                    <tr key={`${producto.producto_id}-${producto.producto_codigo}`}>
                      <td>
                        <strong>{producto.producto_nombre}</strong>
                        <small>{producto.producto_codigo}</small>
                      </td>
                      <td>{producto.cantidad}</td>
                      <td>{formatearMoneda(producto.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reporte-panel">
          <h3>Por cajero</h3>
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr><th>Cajero</th><th>Ventas</th><th>Total</th></tr>
              </thead>
              <tbody>
                {data.por_cajero.length === 0 ? (
                  <tr><td colSpan="3" className="tabla-vacia">Sin datos.</td></tr>
                ) : (
                  data.por_cajero.map((cajero) => (
                    <tr key={cajero.usuario_id}>
                      <td>{cajero.cajero}</td>
                      <td>{cajero.ventas_count}</td>
                      <td>{formatearMoneda(cajero.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="reporte-panel">
        <h3>Últimas ventas</h3>
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Cajero</th>
                <th>Método</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimas.length === 0 ? (
                <tr><td colSpan="7" className="tabla-vacia">Sin ventas.</td></tr>
              ) : (
                data.ultimas.map((venta) => (
                  <tr key={venta.id}>
                    <td><strong>{venta.numero}</strong></td>
                    <td>{formatearFechaHora(venta.creado_en)}</td>
                    <td>{venta.cliente_nombre || 'Consumidor Final'}</td>
                    <td>{venta.cajero}</td>
                    <td>{ETIQUETAS_METODO[venta.metodo_pago] || venta.metodo_pago}</td>
                    <td>{formatearMoneda(venta.total)}</td>
                    <td>
                      <span className={`chip ${venta.estado === 'completada' ? 'chip-ok' : 'chip-peligro'}`}>
                        {venta.estado === 'completada' ? 'Completada' : 'Anulada'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
