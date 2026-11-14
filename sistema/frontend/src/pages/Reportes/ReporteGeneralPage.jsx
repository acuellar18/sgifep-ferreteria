import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement, Title } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement, Title);
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import ErrorBoundary from '../../components/ErrorBoundary';

const HOY = new Date();
function fechaLocal(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function inicioMes() {
  return new Date(HOY.getFullYear(), HOY.getMonth(), 1);
}

function finMes() {
  return new Date(HOY.getFullYear(), HOY.getMonth() + 1, 0);
}

function inicioAno() {
  return new Date(HOY.getFullYear(), 0, 1);
}

const ATAJOS = [
  { id: 'hoy', etiqueta: 'Hoy', calc: () => ({ desde: fechaLocal(HOY), hasta: fechaLocal(HOY) }) },
  { id: 'semana', etiqueta: 'Semana', calc: () => {
    const inicio = new Date(HOY);
    inicio.setDate(inicio.getDate() - 6);
    return { desde: fechaLocal(inicio), hasta: fechaLocal(HOY) };
  }},
  { id: 'mes', etiqueta: 'Mes', calc: () => ({ desde: fechaLocal(inicioMes()), hasta: fechaLocal(HOY) }) },
  { id: 'ano', etiqueta: 'Año', calc: () => ({ desde: fechaLocal(inicioAno()), hasta: fechaLocal(HOY) }) },
  { id: 'todo', etiqueta: 'Todo', calc: () => ({ desde: '', hasta: '' }) }
];

const KPI_INICIAL = {
  ventas_dia: { count: 0, total: 0 },
  ventas_mes: { count: 0, total: 0 },
  compras_mes: { count: 0, total: 0 },
  utilidad_estimada: 0,
  productos_inventario: { total: 0, stock_total: 0 },
  stock_bajo: 0,
  usuarios_activos: 0,
  cuentas_por_pagar: { count: 0, total: 0 }
};

function formatearMoneda(valor) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat('es-GT', {
    style: 'currency', currency: 'GTQ', minimumFractionDigits: 2
  }).format(Number.isFinite(numero) ? numero : 0);
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const v = String(fecha).slice(0, 10);
  const [anio, mes, dia] = v.split('-');
  if (!anio || !mes || !dia) return '—';
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala' });
}

const ETIQUETAS_METODO = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', credito: 'Crédito', contado: 'Contado' };

export default function ReporteGeneralPage() {
  const notificar = useNotificacion();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    kpis: KPI_INICIAL,
    ventas_vs_compras: [],
    ventas_por_dia: [],
    top_productos: [],
    ventas_por_vendedor: [],
    inventario_por_categoria: [],
    ultimas_ventas: [],
    ultimas_compras: [],
    productos_stock_bajo: [],
    movimientos_recientes: []
  });

  const [desde, setDesde] = useState(fechaLocal(inicioMes()));
  const [hasta, setHasta] = useState(fechaLocal(HOY));
  const [atajoActivo, setAtajoActivo] = useState('mes');
  const solicitudActual = useRef(0);

  const cargar = useCallback(async (d, h) => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = {};
      if (d) params.desde = d;
      if (h) params.hasta = h;
      const res = await api.get('/reportes/general', { params });
      if (solicitud !== solicitudActual.current) return;
      setData({
        kpis: { ...KPI_INICIAL, ...(res.data?.kpis || {}) },
        ventas_vs_compras: res.data?.ventas_vs_compras || [],
        ventas_por_dia: res.data?.ventas_por_dia || [],
        top_productos: res.data?.top_productos || [],
        ventas_por_vendedor: res.data?.ventas_por_vendedor || [],
        inventario_por_categoria: res.data?.inventario_por_categoria || [],
        ultimas_ventas: res.data?.ultimas_ventas || [],
        ultimas_compras: res.data?.ultimas_compras || [],
        productos_stock_bajo: res.data?.productos_stock_bajo || [],
        movimientos_recientes: res.data?.movimientos_recientes || []
      });
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setError(err.message);
      notificar.error(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(desde, hasta); }, [desde, hasta, cargar]);

  function aplicarAtajo(atajo) {
    const rango = atajo.calc();
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setAtajoActivo(atajo.id);
  }

  function aplicarPersonalizado() {
    if (desde && hasta && desde > hasta) {
      notificar.error('La fecha inicial no puede ser mayor que la final');
      return;
    }
    setAtajoActivo('');
    cargar(desde, hasta);
  }

  // ---- Chart data ----
  const maxProd = Math.max(...data.top_productos.map(p => Number(p.cantidad || 0)), 1);
  const maxVend = Math.max(...data.ventas_por_vendedor.map(v => Number(v.total || 0)), 1);
  const maxCat = Math.max(...data.inventario_por_categoria.map(c => Number(c.productos_count || 0)), 1);

  const barVvsC = {
    labels: data.ventas_vs_compras.map(m => m.mes),
    datasets: [
      { label: 'Ventas', data: data.ventas_vs_compras.map(m => Number(m.ventas || 0)), backgroundColor: '#16a34a', borderRadius: 6, maxBarThickness: 40 },
      { label: 'Compras', data: data.ventas_vs_compras.map(m => Number(m.compras || 0)), backgroundColor: '#d97706', borderRadius: 6, maxBarThickness: 40 }
    ]
  };

  const barVvsCOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, padding: 12, color: '#4b5563' } },
      tooltip: { callbacks: { label: ctx => formatearMoneda(ctx.raw) } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => `Q${Number(v).toLocaleString('es-GT')}` } }
    }
  };

  const pieCategoria = {
    labels: data.inventario_por_categoria.map(c => c.nombre),
    datasets: [{
      data: data.inventario_por_categoria.map(c => Number(c.productos_count || 0)),
      backgroundColor: ['#16a34a', '#d97706', '#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#059669', '#9333ea', '#0e7490', '#be123c'],
      borderWidth: 0
    }]
  };

  const pieOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, padding: 10, color: '#4b5563', font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => {
        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
        const pct = total > 0 ? (ctx.raw / total) * 100 : 0;
        return `${ctx.label}: ${ctx.raw} productos (${pct.toFixed(1)}%)`;
      }}}
    }
  };

  function textoPeriodo() {
    const d = desde ? formatearFecha(desde) : 'el inicio';
    const h = hasta ? formatearFecha(hasta) : 'hoy';
    return `Del ${d} al ${h}`;
  }

  // ---- Export ----
  function filasExport() {
    const filas = [];
    filas.push({ Seccion: 'KPIs', Indicador: 'Ventas del día', Valor: `${data.kpis.ventas_dia.count} ventas - ${formatearMoneda(data.kpis.ventas_dia.total)}` });
    filas.push({ Seccion: 'KPIs', Indicador: 'Ventas del mes', Valor: `${data.kpis.ventas_mes.count} ventas - ${formatearMoneda(data.kpis.ventas_mes.total)}` });
    filas.push({ Seccion: 'KPIs', Indicador: 'Compras del mes', Valor: `${data.kpis.compras_mes.count} compras - ${formatearMoneda(data.kpis.compras_mes.total)}` });
    filas.push({ Seccion: 'KPIs', Indicador: 'Utilidad estimada', Valor: formatearMoneda(data.kpis.utilidad_estimada) });
    filas.push({ Seccion: 'KPIs', Indicador: 'Productos en inventario', Valor: String(data.kpis.productos_inventario.total) });
    filas.push({ Seccion: 'KPIs', Indicador: 'Stock bajo', Valor: String(data.kpis.stock_bajo) });
    filas.push({ Seccion: 'KPIs', Indicador: 'Usuarios activos', Valor: String(data.kpis.usuarios_activos) });
    filas.push({ Seccion: 'KPIs', Indicador: 'Cuentas por pagar', Valor: `${data.kpis.cuentas_por_pagar.count} cuentas - ${formatearMoneda(data.kpis.cuentas_por_pagar.total)}` });
    data.ultimas_ventas.forEach(v => filas.push({ Seccion: 'Últimas ventas', Indicador: v.numero, Valor: `${formatearMoneda(v.total)} - ${v.cliente}` }));
    data.ultimas_compras.forEach(c => filas.push({ Seccion: 'Últimas compras', Indicador: c.numero, Valor: `${formatearMoneda(c.total)} - ${c.proveedor}` }));
    data.productos_stock_bajo.forEach(p => filas.push({ Seccion: 'Stock bajo', Indicador: `${p.codigo} - ${p.nombre}`, Valor: `${p.stock_actual}/${p.stock_minimo} ${p.unidad_medida}` }));
    return filas;
  }

  function exportarCsv() {
    const filas = filasExport();
    if (exportarCSV(filas, `reporte-general-${fechaLocal(HOY)}.csv`)) notificar.exito('CSV generado');
    else notificar.error('No hay datos para exportar');
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasExport()), 'Reporte General');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.ventas_vs_compras), 'Ventas vs Compras');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.ventas_por_dia), 'Ventas por día');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.ventas_por_vendedor), 'Por Vendedor');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.inventario_por_categoria), 'Inventario por Categoría');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.movimientos_recientes), 'Movimientos');
    XLSX.writeFile(wb, `reporte-general-${fechaLocal(HOY)}.xlsx`);
    notificar.exito('Excel generado');
  }

  async function construirPdfDocumento() {
    const doc = new jsPDF();
    const AP = 210;

    // Cargar logo
    let logoB64 = null;
    try {
      const r = await fetch('/img/logo.png');
      const b = await r.arrayBuffer();
      const u = new Uint8Array(b);
      let s = '';
      u.forEach(v => s += String.fromCharCode(v));
      logoB64 = `data:image/png;base64,${btoa(s)}`;
    } catch {}

    // Encabezado con línea verde debajo
    if (logoB64) {
      doc.addImage(logoB64, 'PNG', 12, 4, 22, 14);
    }
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.text('Ferretería El Puente', logoB64 ? 38 : 14, 14);
    doc.setFontSize(9);
    doc.text('SGIFEP — Sistema de Gestión Integral', logoB64 ? 38 : 14, 21);

    // Tarjeta de título a la derecha
    const tx = AP - 68;
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(255, 255, 255);
    doc.rect(tx, 4, 60, 20, 'DF');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.text('REPORTE', tx + 5, 10);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.text('Reporte General', tx + 5, 17);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(textoPeriodo(), tx + 5, 23);

    // Línea verde debajo del encabezado
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(12, 36, AP - 12, 36);
    doc.setLineWidth(0.1);

    // Filtros
    let y = 38;
    doc.setFillColor(248, 249, 250);
    doc.rect(12, y, AP - 24, 6, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.2);
    doc.line(12, y, 12, y + 6);
    doc.setLineWidth(0.1);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    doc.text('Filtros:', 15, y + 4.5);
    doc.setTextColor(55, 65, 81);
    doc.text(textoPeriodo(), 32, y + 4.5);
    y += 11;

    const kpis = [
      ['Ventas del día', `${data.kpis.ventas_dia.count} ventas`, formatearMoneda(data.kpis.ventas_dia.total)],
      ['Ventas del mes', `${data.kpis.ventas_mes.count} ventas`, formatearMoneda(data.kpis.ventas_mes.total)],
      ['Compras del mes', `${data.kpis.compras_mes.count} compras`, formatearMoneda(data.kpis.compras_mes.total)],
      ['Utilidad estimada', '', formatearMoneda(data.kpis.utilidad_estimada)],
      ['Productos en inventario', String(data.kpis.productos_inventario.total), ''],
      ['Stock bajo', String(data.kpis.stock_bajo), ''],
      ['Usuarios activos', String(data.kpis.usuarios_activos), ''],
      ['Cuentas por pagar', `${data.kpis.cuentas_por_pagar.count} cuentas`, formatearMoneda(data.kpis.cuentas_por_pagar.total)]
    ];

    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Detalle', 'Valor']],
      body: kpis,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' } }
    });

    if (data.ultimas_ventas.length) {
      y = doc.lastAutoTable.finalY + 6;
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.text('Últimas ventas', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['No.', 'Cliente', 'Total', 'Fecha']],
        body: data.ultimas_ventas.slice(0, 10).map(v => [v.numero, v.cliente, formatearMoneda(v.total), formatearFechaHora(v.creado_en)]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 2: { halign: 'right' } }
      });
    }

    if (data.productos_stock_bajo.length) {
      y = doc.lastAutoTable.finalY + 6;
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.text('Productos con stock bajo', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Código', 'Producto', 'Stock actual', 'Stock mínimo']],
        body: data.productos_stock_bajo.map(p => [p.codigo, p.nombre, String(p.stock_actual), String(p.stock_minimo)]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
      });
    }

    // Totales
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 10;
    const totVentas = data.kpis.ventas_mes.total;
    const totCompras = data.kpis.compras_mes.total;
    const totGanancia = data.kpis.utilidad_estimada;
    const tc = [totVentas, totCompras, totGanancia].map(v => ({ monto: v }));
    const tl = AP - 14;
    const tcw = 44;
    const tcg = 5;
    const tcTotal = tc.length * tcw + (tc.length - 1) * tcg;
    const tcStart = tl - tcTotal;

    tc.forEach((t, i) => {
      const cx = tcStart + i * (tcw + tcg);
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(248, 249, 250);
      doc.rect(cx, y, tcw, 12, 'DF');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(6);
      const labels = ['Total ventas', 'Total compras', 'Ganancia'];
      doc.text(labels[i].toUpperCase(), cx + 2, y + 3.5);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(9);
      doc.text(formatearMoneda(t.monto), cx + tcw - 2, y + 8.5, { align: 'right' });
    });
    y += 18;

    // Pie
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`Registros: ${kpis.length} indicadores`, 14, y);
    const ahora = new Date();
    const fechaGen = ahora.toLocaleDateString('es-GT', { timeZone: 'America/Guatemala' }) + ', ' + ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala' });
    doc.text(`Generado el ${fechaGen}`, AP - 14, y, { align: 'right' });

    return doc;
  }

  async function exportarPdf() {
    const doc = await construirPdfDocumento();
    if (!doc) return;
    doc.save(`reporte-general-${fechaLocal(HOY)}.pdf`);
    notificar.exito('PDF descargado');
  }

async function imprimir() {
    try {
      const doc = await construirPdfDocumento();
      if (!doc) return;
      const url = URL.createObjectURL(doc.output('blob'));
      const ventana = window.open(url, '_blank');
      if (ventana) setTimeout(() => URL.revokeObjectURL(url), 60000);
      else {
        URL.revokeObjectURL(url);
        notificar.error('Permite la ventana emergente para imprimir');
      }
    } catch {
      notificar.error('No se pudo abrir la ventana de impresión');
    }
  }


  return (
    <ErrorBoundary>
    <section className="reporte-compras">
      <header className="reporte-cabecera">
        <div>
          <h2>Reporte General</h2>
          <p>Dashboard central: indicadores clave, gráficos comparativos y resúmenes de ventas, compras e inventario.</p>
        </div>
        <div className="reporte-acciones">
          <button type="button" className="btn btn-secundario" onClick={exportarCsv}>CSV</button>
          <button type="button" className="btn btn-secundario" onClick={exportarExcel}>Excel</button>
          <button type="button" className="btn btn-secundario" onClick={exportarPdf}>PDF</button>
          <button type="button" className="btn btn-primario" onClick={imprimir}>Imprimir</button>
        </div>
      </header>

      {/* Filtros */}
      <div className="reporte-filtros" style={{ padding: '14px 18px' }}>
        <div className="reporte-filtros-grid reporte-filtros-grid--general">
          <label className="reporte-campo">
            <span>Desde</span>
            <input type="date" className="control" value={desde} onChange={e => { setDesde(e.target.value); setAtajoActivo(''); }} />
          </label>
          <label className="reporte-campo">
            <span>Hasta</span>
            <input type="date" className="control" value={hasta} onChange={e => { setHasta(e.target.value); setAtajoActivo(''); }} />
          </label>
          <label className="reporte-campo">
            <span>Atajos</span>
            <div className="reporte-atajos" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {ATAJOS.map(a => (
                <button key={a.id} type="button" className={`reporte-atajo${atajoActivo === a.id ? '' : ''}`}
                  style={atajoActivo === a.id ? { borderColor: 'var(--color-primario)', color: 'var(--color-primario)', fontWeight: 700 } : {}}
                  onClick={() => aplicarAtajo(a)}>{a.etiqueta}</button>
              ))}
            </div>
          </label>
          <div className="reporte-campo" style={{ justifyContent: 'flex-end' }}>
            <span>&nbsp;</span>
            <button type="button" className="btn btn-primario" onClick={aplicarPersonalizado} style={{ width: '100%' }}>Aplicar</button>
          </div>
        </div>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      <p className="reporte-print-meta">
        Ferretería El Puente · Reporte General · {textoPeriodo()} · Generado: {new Date().toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala' })}
      </p>

      {/* KPIs */}
      <div className="reporte-kpis">
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Ventas del día</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(data.kpis.ventas_dia.total)}</strong>
          <span className="reporte-kpi-ayuda">{data.kpis.ventas_dia.count} ventas hoy</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Ventas del mes</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(data.kpis.ventas_mes.total)}</strong>
          <span className="reporte-kpi-ayuda">{data.kpis.ventas_mes.count} ventas en el mes</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Compras del mes</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(data.kpis.compras_mes.total)}</strong>
          <span className="reporte-kpi-ayuda">{data.kpis.compras_mes.count} compras</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Utilidad estimada</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(data.kpis.utilidad_estimada)}</strong>
          <span className="reporte-kpi-ayuda">Margen bruto del mes</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Productos</span>
          <strong className="reporte-kpi-valor">{data.kpis.productos_inventario.total}</strong>
          <span className="reporte-kpi-ayuda">{data.kpis.productos_inventario.stock_total} unidades en existencia</span>
        </article>
        <article className={`reporte-kpi${data.kpis.stock_bajo > 0 ? ' reporte-kpi-pendiente' : ''}`}>
          <span className="reporte-kpi-etiqueta">Stock bajo</span>
          <strong className="reporte-kpi-valor">{data.kpis.stock_bajo}</strong>
          <span className="reporte-kpi-ayuda">Productos por debajo del mínimo</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Usuarios activos</span>
          <strong className="reporte-kpi-valor">{data.kpis.usuarios_activos}</strong>
          <span className="reporte-kpi-ayuda">Cuentas habilitadas en el sistema</span>
        </article>
        <article className={`reporte-kpi${data.kpis.cuentas_por_pagar.total > 0 ? ' reporte-kpi-pendiente' : ''}`}>
          <span className="reporte-kpi-etiqueta">Cuentas por pagar</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(data.kpis.cuentas_por_pagar.total)}</strong>
          <span className="reporte-kpi-ayuda">{data.kpis.cuentas_por_pagar.count} facturas pendientes</span>
        </article>
      </div>

      {cargando && <p className="reporte-cargando">Cargando dashboard...</p>}

      {/* Charts */}
      <section className="reporte-seccion">
        <div className="reporte-seccion-titulo">
          <div>
            <h3>Gráficos comparativos</h3>
            <p>{textoPeriodo()}</p>
          </div>
        </div>
        <div className="reporte-doble">
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Ventas vs Compras por mes</h4>
                <p>Comparativa mensual de ingresos y egresos.</p>
              </div>
            </div>
            <div>
              {data.ventas_vs_compras.length ? (
                <div className="reporte-grafico"><Bar data={barVvsC} options={barVvsCOptions} /></div>
              ) : (
                <div className="reporte-vacio">Sin datos en el período seleccionado.</div>
              )}
            </div>
          </article>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Inventario por categoría</h4>
                <p>Distribución de productos por categoría.</p>
              </div>
            </div>
            <div>
              {data.inventario_por_categoria.length ? (
                <div className="reporte-grafico" style={{ height: '260px' }}><Pie data={pieCategoria} options={pieOptions} /></div>
              ) : (
                <div className="reporte-vacio">Sin categorías registradas.</div>
              )}
            </div>
          </article>
        </div>

        <div className="reporte-doble" style={{ marginTop: '20px' }}>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Top 5 productos más vendidos</h4>
                <p>Productos con mayor cantidad vendida.</p>
              </div>
            </div>
            <div>
              {data.top_productos.length ? (
                <div className="reporte-ranking">
                  {data.top_productos.slice(0, 5).map((p, i) => {
                    const ancho = Math.max(6, (Number(p.cantidad || 0) / maxProd) * 100);
                    return (
                      <div key={p.id || i} className="reporte-ranking-item">
                        <div className="reporte-ranking-cabecera">
                          <span className="reporte-ranking-puesto">{i + 1}</span>
                          <span className="reporte-ranking-nombre">{p.nombre}</span>
                          <strong>{Number(p.cantidad || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="reporte-ranking-barra"><span style={{ width: `${ancho}%` }} /></div>
                        <span className="reporte-ranking-detalle">{formatearMoneda(p.total)} vendido</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="reporte-vacio">Sin ventas en el período.</div>
              )}
            </div>
          </article>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Ventas por vendedor</h4>
                <p>Desempeño de cada usuario en ventas.</p>
              </div>
            </div>
            <div>
              {data.ventas_por_vendedor.length ? (
                <div className="reporte-ranking">
                  {data.ventas_por_vendedor.slice(0, 8).map((v, i) => {
                    const ancho = Math.max(6, (Number(v.total || 0) / maxVend) * 100);
                    return (
                      <div key={v.usuario_id || i} className="reporte-ranking-item">
                        <div className="reporte-ranking-cabecera">
                          <span className="reporte-ranking-puesto">{i + 1}</span>
                          <span className="reporte-ranking-nombre">{v.nombre}</span>
                          <strong>{formatearMoneda(v.total)}</strong>
                        </div>
                        <div className="reporte-ranking-barra"><span style={{ width: `${ancho}%` }} /></div>
                        <span className="reporte-ranking-detalle">{v.ventas_count} {v.ventas_count === 1 ? 'venta' : 'ventas'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="reporte-vacio">Sin ventas registradas.</div>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Tablas resumen */}
      <section className="reporte-seccion">
        <div className="reporte-seccion-titulo">
          <div>
            <h3>Tablas resumen</h3>
            <p>Información detallada de los últimos registros.</p>
          </div>
        </div>

        <div className="reporte-doble">
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Últimas ventas</h4>
                <p>Las {Math.min(10, data.ultimas_ventas.length || 0)} transacciones más recientes.</p>
              </div>
              <Link to="/reportes/ventas" className="reporte-enlace">Ver reporte completo</Link>
            </div>
            {data.ultimas_ventas.length ? (
              <div className="reporte-tabla-wrapper">
                <table className="tabla reporte-tabla">
                  <thead><tr><th>No.</th><th>Cliente</th><th>Usuario</th><th>Método</th><th className="reporte-numero">Total</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {data.ultimas_ventas.slice(0, 10).map(v => (
                      <tr key={v.id}>
                        <td><strong>{v.numero}</strong></td>
                        <td>{v.cliente}</td>
                        <td>{v.usuario}</td>
                        <td>{ETIQUETAS_METODO[v.metodo_pago] || v.metodo_pago}</td>
                        <td className="reporte-numero">{formatearMoneda(v.total)}</td>
                        <td>{formatearFechaHora(v.creado_en)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reporte-vacio">Sin ventas en el período.</div>
            )}
          </article>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Últimas compras</h4>
                <p>Las {Math.min(10, data.ultimas_compras.length || 0)} compras más recientes.</p>
              </div>
              <Link to="/reportes/compras" className="reporte-enlace">Ver reporte completo</Link>
            </div>
            {data.ultimas_compras.length ? (
              <div className="reporte-tabla-wrapper">
                <table className="tabla reporte-tabla">
                  <thead><tr><th>No.</th><th>Proveedor</th><th className="reporte-numero">Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {data.ultimas_compras.slice(0, 10).map(c => (
                      <tr key={c.id}>
                        <td>{c.numero}</td>
                        <td>{c.proveedor}</td>
                        <td className="reporte-numero">{formatearMoneda(c.total)}</td>
                        <td><span className={`chip ${c.estado_pago === 'pagada' ? 'chip-ok' : c.estado_pago === 'pendiente' ? 'chip-peligro' : ''}`}>{c.estado_pago === 'pagada' ? 'Pagada' : c.estado_pago === 'pendiente' ? 'Pendiente' : 'Parcial'}</span></td>
                        <td>{formatearFecha(c.fecha)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reporte-vacio">Sin compras en el período.</div>
            )}
          </article>
        </div>

        <div className="reporte-doble" style={{ marginTop: '20px' }}>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Ventas por día</h4>
                <p>Resumen diario de ventas en el período seleccionado.</p>
              </div>
              <Link to="/reportes/ventas" className="reporte-enlace">Ver reporte completo</Link>
            </div>
            {data.ventas_por_dia.length ? (
              <div className="reporte-tabla-wrapper">
                <table className="tabla reporte-tabla">
                  <thead><tr><th>Fecha</th><th className="reporte-numero">Ventas</th><th className="reporte-numero">Total</th><th className="reporte-numero">Efectivo</th><th className="reporte-numero">Tarjeta</th><th className="reporte-numero">Transferencia</th></tr></thead>
                  <tbody>
                    {data.ventas_por_dia.map(d => (
                      <tr key={d.fecha}>
                        <td>{formatearFecha(d.fecha)}</td>
                        <td className="reporte-numero">{d.ventas_count}</td>
                        <td className="reporte-numero">{formatearMoneda(d.total)}</td>
                        <td className="reporte-numero">{formatearMoneda(d.efectivo)}</td>
                        <td className="reporte-numero">{formatearMoneda(d.tarjeta)}</td>
                        <td className="reporte-numero">{formatearMoneda(d.transferencia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reporte-vacio">Sin ventas en el período.</div>
            )}
          </article>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Productos con stock bajo o agotados</h4>
                <p>Artículos que requieren reposición.</p>
              </div>
              <Link to="/inventario/productos" className="reporte-enlace">Ir a productos</Link>
            </div>
            {data.productos_stock_bajo.length ? (
              <div className="reporte-tabla-wrapper">
                <table className="tabla reporte-tabla">
                  <thead><tr><th>Código</th><th>Producto</th><th className="reporte-numero">Stock actual</th><th className="reporte-numero">Stock mínimo</th><th>Estado</th></tr></thead>
                  <tbody>
                    {data.productos_stock_bajo.map(p => (
                      <tr key={p.id}>
                        <td>{p.codigo}</td>
                        <td>{p.nombre}</td>
                        <td className="reporte-numero">{Number(p.stock_actual || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        <td className="reporte-numero">{Number(p.stock_minimo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        <td><span className={`chip ${p.stock_actual <= 0 ? 'chip-peligro' : 'chip-alerta'}`}>{p.stock_actual <= 0 ? 'Agotado' : 'Stock bajo'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reporte-vacio">Todos los productos tienen stock suficiente.</div>
            )}
          </article>
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Movimientos recientes</h4>
                <p>Últimos movimientos de inventario registrados.</p>
              </div>
              <Link to="/inventario/movimientos" className="reporte-enlace">Ver todos</Link>
            </div>
            {data.movimientos_recientes.length ? (
              <div className="reporte-tabla-wrapper">
                <table className="tabla reporte-tabla">
                  <thead><tr><th>Tipo</th><th>Producto</th><th className="reporte-numero">Cantidad</th><th>Usuario</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {data.movimientos_recientes.slice(0, 10).map(m => (
                      <tr key={m.id}>
                        <td><span className={`chip ${m.tipo === 'entrada' ? 'chip-ok' : m.tipo === 'salida' ? 'chip-peligro' : ''}`}>{m.tipo}</span></td>
                        <td><small>{m.producto_codigo}</small> {m.producto}</td>
                        <td className="reporte-numero">{Number(m.cantidad || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        <td>{m.usuario}</td>
                        <td>{formatearFechaHora(m.creado_en)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reporte-vacio">Sin movimientos registrados.</div>
            )}
          </article>
        </div>
      </section>

      {cargando && <p className="reporte-cargando">Cargando dashboard...</p>}
    </section>
    </ErrorBoundary>
  );
}