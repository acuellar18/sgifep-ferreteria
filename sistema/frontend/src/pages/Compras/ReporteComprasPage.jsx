import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import FiltrosReporteCompras from './FiltrosReporteCompras';

ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FILTROS_INICIALES = {
  startDate: '',
  endDate: '',
  proveedor: '',
  categoria: ''
};

const RESUMEN_INICIAL = {
  total_comprado: 0,
  num_compras: 0,
  promedio_compra: 0,
  total_por_pagar: 0
};

export default function ReporteComprasPage() {
  const notificar = useNotificacion();

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(RESUMEN_INICIAL);
  const [comprasPorMes, setComprasPorMes] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [productosMasComprados, setProductosMasComprados] = useState([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [variacionProducto, setVariacionProducto] = useState(null);
  const [variacionModal, setVariacionModal] = useState(false);
  const solicitudActual = useRef(0);

  const cargarDatos = useCallback(async (filtrosActuales = {}) => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor) params[clave] = valor;
      }
      const [resResumen, resMes, resTop, resProd, resCuentas] = await Promise.all([
        api.get('/reportes-compras/resumen', { params }),
        api.get('/reportes-compras/compras-por-mes', { params }),
        api.get('/reportes-compras/top-proveedores', { params }),
        api.get('/reportes-compras/productos-mas-comprados', { params: { ...params, limite: 10 } }),
        api.get('/reportes-compras/cuentas-por-pagar', { params })
      ]);
      if (solicitud !== solicitudActual.current) return;
      setResumen(resResumen.data);
      setComprasPorMes(resMes.data);
      setTopProveedores(resTop.data);
      setProductosMasComprados(resProd.data);
      setCuentasPorPagar(resCuentas.data);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setError(err.message);
      notificar.error(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resProv, resCat] = await Promise.all([
        api.get('/proveedores/resumen?estado=activo'),
        api.get('/reportes-compras/categorias')
      ]);
      setProveedores(resProv.data);
      setCategorias(resCat.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarDatos(filtrosAplicados);
  }, [filtrosAplicados, cargarDatos]);

  function fechaLocal(fecha) {
    const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function aplicarFiltros(e) {
    e.preventDefault();
    setFiltrosAplicados({ ...filtros });
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setFiltrosAplicados(FILTROS_INICIALES);
  }

  function aplicarAtajo(dias) {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - dias);
    const nuevos = {
      ...filtros,
      startDate: fechaLocal(inicio),
      endDate: fechaLocal(hoy)
    };
    setFiltros(nuevos);
    setFiltrosAplicados(nuevos);
  }

  async function verVariacionCosto(producto) {
    try {
      const res = await api.get(`/reportes-compras/variacion-costo/${producto.id}`, {
        params: {
          startDate: filtrosAplicados.startDate,
          endDate: filtrosAplicados.endDate
        }
      });
      setVariacionProducto({ ...producto, datos: res.data });
      setVariacionModal(true);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function formatearMoneda(valor) {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(numero);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    const valor = String(fecha).slice(0, 10);
    const [anio, mes, dia] = valor.split('-');
    if (!anio || !mes || !dia) return fecha;
    return `${dia}/${mes}/${anio}`;
  }

  function nombreProveedor(id) {
    const proveedor = proveedores.find((p) => String(p.id) === String(id));
    return proveedor ? proveedor.nombre : 'Todos';
  }

  function nombreCategoria(id) {
    const categoria = categorias.find((c) => String(c.id) === String(id));
    return categoria ? categoria.nombre : 'Todas';
  }

  function textoPeriodo() {
    const desde = filtrosAplicados.startDate ? formatearFecha(filtrosAplicados.startDate) : 'el inicio';
    const hasta = filtrosAplicados.endDate ? formatearFecha(filtrosAplicados.endDate) : 'hoy';
    return `Del ${desde} al ${hasta}`;
  }

  function badgeVencimiento(cuenta) {
    const estados = {
      vencida: { clase: 'reporte-badge-vencida', texto: 'Vencida' },
      hoy: { clase: 'reporte-badge-hoy', texto: 'Vence hoy' },
      por_vencer: { clase: 'reporte-badge-proxima', texto: 'Próxima' },
      pagada: { clase: 'reporte-badge-pagada', texto: 'Pagada' },
      normal: { clase: 'reporte-badge-normal', texto: 'Al día' }
    };
    const estado = estados[cuenta.estado_vencimiento] || estados.normal;
    return <span className={`reporte-badge ${estado.clase}`}>{estado.texto}</span>;
  }

  const barData = {
    labels: comprasPorMes.map((mes) => mes.mes),
    datasets: [{
      label: 'Total comprado',
      data: comprasPorMes.map((mes) => Number(mes.total || 0)),
      backgroundColor: '#16a34a',
      borderRadius: 6,
      maxBarThickness: 54
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (contexto) => formatearMoneda(contexto.raw)
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#6b7280',
          callback: (valor) => `Q${Number(valor).toLocaleString('es-GT')}`
        }
      }
    }
  };

  const maxProveedor = Math.max(...topProveedores.map((p) => Number(p.total_comprado || 0)), 1);
  const totalComprado = Number(resumen.total_comprado || 0);
  const productosVisibles = productosMasComprados.slice(0, 5);
  const cuentasVisibles = cuentasPorPagar.slice(0, 10);

  function exportarCSVReporte() {
    const filas = [
      { Sección: 'Resumen', Referencia: 'Total comprado', Cantidad: '', Total: totalComprado, Saldo: '', Vencimiento: '', Estado: '' },
      { Sección: 'Resumen', Referencia: 'Facturas registradas', Cantidad: Number(resumen.num_compras), Total: '', Saldo: '', Vencimiento: '', Estado: '' },
      { Sección: 'Resumen', Referencia: 'Promedio por factura', Cantidad: '', Total: Number(resumen.promedio_compra), Saldo: '', Vencimiento: '', Estado: '' },
      { Sección: 'Resumen', Referencia: 'Saldo por pagar', Cantidad: '', Total: '', Saldo: Number(resumen.total_por_pagar), Vencimiento: '', Estado: '' }
    ];

    comprasPorMes.forEach((mes) => filas.push({
      Sección: 'Compras por mes',
      Referencia: mes.mes,
      Cantidad: Number(mes.cantidad),
      Total: Number(mes.total),
      Saldo: '',
      Vencimiento: '',
      Estado: ''
    }));

    topProveedores.forEach((proveedor) => filas.push({
      Sección: 'Proveedores',
      Referencia: proveedor.nombre,
      Cantidad: Number(proveedor.num_compras),
      Total: Number(proveedor.total_comprado),
      Saldo: '',
      Vencimiento: '',
      Estado: ''
    }));

    productosMasComprados.forEach((producto) => filas.push({
      Sección: 'Productos',
      Referencia: `${producto.codigo} - ${producto.nombre}`,
      Cantidad: Number(producto.cantidad_total),
      Total: Number(producto.total_comprado),
      Saldo: '',
      Vencimiento: '',
      Estado: ''
    }));

    cuentasPorPagar.forEach((cuenta) => filas.push({
      Sección: 'Cuentas por pagar',
      Referencia: `${cuenta.numero} - ${cuenta.proveedor_nombre}`,
      Cantidad: '',
      Total: Number(cuenta.total),
      Saldo: Number(cuenta.saldo_pendiente),
      Vencimiento: cuenta.fecha_vencimiento,
      Estado: cuenta.estado_vencimiento
    }));

    const generado = exportarCSV(filas, `reporte_compras_${fechaLocal(new Date())}.csv`);
    if (generado) notificar.exito('CSV generado correctamente');
    else notificar.error('No hay datos para exportar');
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    const wsFiltros = XLSX.utils.json_to_sheet([{
      Proveedor: nombreProveedor(filtrosAplicados.proveedor),
      Categoría: nombreCategoria(filtrosAplicados.categoria),
      Desde: filtrosAplicados.startDate || 'Inicio',
      Hasta: filtrosAplicados.endDate || 'Hoy'
    }]);
    XLSX.utils.book_append_sheet(wb, wsFiltros, 'Filtros');

    const wsResumen = XLSX.utils.json_to_sheet([{
      'Total comprado': formatearMoneda(totalComprado),
      'Facturas registradas': resumen.num_compras,
      'Promedio por factura': formatearMoneda(resumen.promedio_compra),
      'Saldo por pagar': formatearMoneda(resumen.total_por_pagar)
    }]);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(comprasPorMes.map((mes) => ({ Mes: mes.mes, Compras: mes.cantidad, Total: formatearMoneda(mes.total) }))),
      'Compras por mes'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(topProveedores.map((proveedor) => ({ Proveedor: proveedor.nombre, Compras: proveedor.num_compras, Total: formatearMoneda(proveedor.total_comprado) }))),
      'Proveedores'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(productosMasComprados.map((producto) => ({ Código: producto.codigo, Producto: producto.nombre, Cantidad: producto.cantidad_total, Total: formatearMoneda(producto.total_comprado), 'Costo promedio': formatearMoneda(producto.costo_promedio) }))),
      'Productos'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(cuentasPorPagar.map((cuenta) => ({ Factura: cuenta.numero, Proveedor: cuenta.proveedor_nombre, Fecha: cuenta.fecha, Vencimiento: cuenta.fecha_vencimiento, Total: formatearMoneda(cuenta.total), Saldo: formatearMoneda(cuenta.saldo_pendiente), Estado: cuenta.estado_vencimiento, Días: cuenta.dias_restantes }))),
      'Cuentas por pagar'
    );

    XLSX.writeFile(wb, `reporte_compras_${fechaLocal(new Date())}.xlsx`);
  }

async function exportarPDF() {
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
    doc.text('Compras', tx + 5, 17);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(`${filtrosAplicados.startDate || 'inicio'} a ${filtrosAplicados.endDate || 'hoy'}`, tx + 5, 23);

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(12, 36, AP - 12, 36);
    doc.setLineWidth(0.1);

    let y = 42;

    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total comprado', formatearMoneda(totalComprado)],
        ['Facturas registradas', resumen.num_compras],
        ['Promedio por factura', formatearMoneda(resumen.promedio_compra)],
        ['Saldo por pagar', formatearMoneda(resumen.total_por_pagar)]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 1: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 6;
    autoTable(doc, {
      startY: y,
      head: [['Mes', 'Compras', 'Total']],
      body: comprasPorMes.map((mes) => [mes.mes, mes.cantidad, formatearMoneda(mes.total)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 6;
    autoTable(doc, {
      startY: y,
      head: [['Proveedor', 'Compras', 'Total']],
      body: topProveedores.map((prov) => [prov.nombre, prov.num_compras, formatearMoneda(prov.total_comprado)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 6;
    autoTable(doc, {
      startY: y,
      head: [['Código', 'Producto', 'Cantidad', 'Total', 'Costo prom.']],
      body: productosMasComprados.map((p) => [p.codigo, p.nombre, p.cantidad_total.toLocaleString('es-GT'), formatearMoneda(p.total_comprado), formatearMoneda(p.costo_promedio)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 6;
    autoTable(doc, {
      startY: y,
      head: [['Factura', 'Proveedor', 'Fecha', 'Vence', 'Total', 'Saldo', 'Días']],
      body: cuentasPorPagar.map((c) => [c.numero, c.proveedor_nombre, c.fecha, c.fecha_vencimiento, formatearMoneda(c.total), formatearMoneda(c.saldo_pendiente), c.dias_restantes]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    const fy = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    const ahora = new Date();
    doc.text(`Generado el ${ahora.toLocaleDateString('es-GT')}, ${ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`, 14, fy);

doc.save(`reporte_compras_${fechaLocal(new Date())}.pdf`);
  }

function imprimirReporte() {
    const f = `${filtrosAplicados.startDate || 'inicio'} a ${filtrosAplicados.endDate || 'hoy'}`;
    const rData = resumen;
    const resumenHtml = `<tr><td>Total comprado</td><td class="num">${formatearMoneda(totalComprado)}</td></tr>
<tr><td>Facturas registradas</td><td class="num">${rData.num_compras}</td></tr>
<tr><td>Promedio por factura</td><td class="num">${formatearMoneda(rData.promedio_compra)}</td></tr>
<tr><td>Saldo por pagar</td><td class="num">${formatearMoneda(rData.total_por_pagar)}</td></tr>`;
    const meses = comprasPorMes.map(m => `<tr><td>${m.mes}</td><td class="num">${m.cantidad}</td><td class="num">${formatearMoneda(m.total)}</td></tr>`).join('');
    const prods = productosMasComprados.map(p => `<tr><td>${p.codigo}</td><td>${p.nombre}</td><td class="num">${p.cantidad_total.toLocaleString('es-GT')}</td><td class="num">${formatearMoneda(p.total_comprado)}</td><td class="num">${formatearMoneda(p.costo_promedio)}</td></tr>`).join('');
    const cuentas = cuentasPorPagar.map(c => `<tr><td>${c.numero}</td><td>${c.proveedor_nombre}</td><td>${c.fecha}</td><td>${c.fecha_vencimiento}</td><td class="num">${formatearMoneda(c.total)}</td><td class="num">${formatearMoneda(c.saldo_pendiente)}</td><td class="num">${c.dias_restantes}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte de Compras</title>
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
<div class="print-documento-titulo"><span class="print-etiqueta">REPORTE</span><strong>Compras</strong><span class="print-numero">${f}</span></div></div>
<div class="print-filtros"><strong>Filtros:</strong> ${f}</div>
<h2 class="print-seccion">Resumen</h2>
<table class="print-tabla"><thead><tr><th>Indicador</th><th class="num">Valor</th></tr></thead><tbody>${resumenHtml}</tbody></table>
<h2 class="print-seccion">Compras por mes</h2>
<table class="print-tabla"><thead><tr><th>Mes</th><th class="num">Compras</th><th class="num">Total</th></tr></thead><tbody>${meses}</tbody></table>
<h2 class="print-seccion">Productos m&aacute;s comprados</h2>
<table class="print-tabla"><thead><tr><th>C&oacute;digo</th><th>Producto</th><th class="num">Cantidad</th><th class="num">Total</th><th class="num">Costo prom.</th></tr></thead><tbody>${prods}</tbody></table>
<h2 class="print-seccion">Cuentas por pagar</h2>
<table class="print-tabla"><thead><tr><th>Factura</th><th>Proveedor</th><th>Fecha</th><th>Vence</th><th class="num">Total</th><th class="num">Saldo</th><th class="num">D&iacute;as</th></tr></thead><tbody>${cuentas}</tbody></table>
<div class="print-meta"><span>Registros: ${comprasPorMes.length} meses</span><span>Generado el ${new Date().toLocaleString('es-GT')}</span></div>
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
    <section className="reporte-compras">
      <header className="reporte-cabecera">
        <div>
          <h2>Reporte de Compras</h2>
          <p>Consulta cuánto compraste, a quién le compraste y cuánto falta pagar.</p>
        </div>
        <div className="reporte-acciones">
          <button type="button" className="btn btn-secundario" onClick={exportarCSVReporte} disabled={cargando}>CSV</button>
          <button type="button" className="btn btn-secundario" onClick={exportarExcel} disabled={cargando}>Excel</button>
          <button type="button" className="btn btn-secundario" onClick={exportarPDF} disabled={cargando}>PDF</button>
          <button type="button" className="btn btn-primario" onClick={imprimirReporte}>Imprimir</button>
        </div>
      </header>

      <FiltrosReporteCompras
        filtros={filtros}
        proveedores={proveedores}
        categorias={categorias}
        onChange={setFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
        onAtajo={aplicarAtajo}
      />

      {error && <div className="alerta alerta-error">{error}</div>}
      {cargando && <p className="reporte-cargando">Actualizando reporte...</p>}

      <p className="reporte-print-meta">
        Período: {textoPeriodo()} · Generado: {new Date().toLocaleDateString('es-GT')}
      </p>

      <div className="reporte-kpis">
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Total comprado</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(totalComprado)}</strong>
          <span className="reporte-kpi-ayuda">Monto de las facturas del período.</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Facturas registradas</span>
          <strong className="reporte-kpi-valor">{Number(resumen.num_compras || 0)}</strong>
          <span className="reporte-kpi-ayuda">Cantidad de compras realizadas.</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Promedio por factura</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(resumen.promedio_compra)}</strong>
          <span className="reporte-kpi-ayuda">Total comprado dividido entre las facturas.</span>
        </article>
        <article className={`reporte-kpi${Number(resumen.total_por_pagar || 0) > 0 ? ' reporte-kpi-pendiente' : ''}`}>
          <span className="reporte-kpi-etiqueta">Saldo por pagar</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(resumen.total_por_pagar)}</strong>
          <span className="reporte-kpi-ayuda">Monto que todavía se debe a proveedores.</span>
        </article>
      </div>

      <section className="reporte-seccion">
        <div className="reporte-seccion-titulo">
          <div>
            <h3>Resumen del período</h3>
            <p>{textoPeriodo()}</p>
          </div>
        </div>

        <div className="reporte-doble">
          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Compras por mes</h4>
                <p>Evolución del monto comprado.</p>
              </div>
            </div>
            {comprasPorMes.length ? (
              <div className="reporte-grafico">
                <Bar data={barData} options={barOptions} />
              </div>
            ) : (
              <div className="reporte-vacio">No hay compras registradas en este período.</div>
            )}
          </article>

          <article className="reporte-panel">
            <div className="reporte-panel-header">
              <div>
                <h4>Proveedores con más compras</h4>
                <p>Participación sobre el total comprado.</p>
              </div>
            </div>
            {topProveedores.length ? (
              <div className="reporte-ranking">
                {topProveedores.slice(0, 5).map((proveedor, indice) => {
                  const monto = Number(proveedor.total_comprado || 0);
                  const porcentaje = totalComprado > 0 ? (monto / totalComprado) * 100 : 0;
                  const ancho = Math.max(6, (monto / maxProveedor) * 100);
                  return (
                    <div className="reporte-ranking-item" key={proveedor.id || proveedor.nombre}>
                      <div className="reporte-ranking-cabecera">
                        <span className="reporte-ranking-puesto">{indice + 1}</span>
                        <span className="reporte-ranking-nombre">{proveedor.nombre}</span>
                        <strong>{formatearMoneda(monto)}</strong>
                      </div>
                      <div className="reporte-ranking-barra">
                        <span style={{ width: `${ancho}%` }} />
                      </div>
                      <span className="reporte-ranking-detalle">
                        {proveedor.num_compras} {Number(proveedor.num_compras) === 1 ? 'compra' : 'compras'} · {porcentaje.toFixed(1)}% del total
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="reporte-vacio">No hay proveedores con compras en este período.</div>
            )}
          </article>
        </div>
      </section>

      <section className="reporte-panel reporte-seccion">
        <div className="reporte-panel-header">
          <div>
            <h3>Productos más comprados</h3>
            <p>Los cinco productos con mayor cantidad comprada.</p>
          </div>
        </div>
        {productosVisibles.length ? (
          <div className="reporte-tabla-wrapper">
            <table className="tabla reporte-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th className="reporte-numero">Cantidad</th>
                  <th className="reporte-numero">Total</th>
                  <th className="reporte-numero">Costo promedio</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {productosVisibles.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td className="reporte-numero">
                      {Number(producto.cantidad_total || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })} {producto.unidad_medida}
                    </td>
                    <td className="reporte-numero">{formatearMoneda(producto.total_comprado)}</td>
                    <td className="reporte-numero">{formatearMoneda(producto.costo_promedio)}</td>
                    <td className="reporte-accion-celda">
                      <button
                        type="button"
                        className="btn btn-opcion reporte-btn-tabla"
                        onClick={() => verVariacionCosto(producto)}
                        title="Ver cómo cambió el costo de este producto"
                      >
                        Ver historial de costo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reporte-vacio">No hay productos comprados en este período.</div>
        )}
      </section>

      <section className="reporte-panel reporte-seccion">
        <div className="reporte-panel-header">
          <div>
            <h3>Cuentas por pagar</h3>
            <p>Facturas pendientes y próximas a vencer.</p>
          </div>
          <Link to="/compras/facturas" className="reporte-enlace">Ver todas las facturas</Link>
        </div>
        {cuentasVisibles.length ? (
          <div className="reporte-tabla-wrapper">
            <table className="tabla reporte-tabla">
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Proveedor</th>
                  <th>Vence</th>
                  <th className="reporte-numero">Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuentasVisibles.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td>{cuenta.numero}</td>
                    <td>{cuenta.proveedor_nombre}</td>
                    <td>{formatearFecha(cuenta.fecha_vencimiento)}</td>
                    <td className="reporte-numero">{formatearMoneda(cuenta.saldo_pendiente)}</td>
                    <td>{badgeVencimiento(cuenta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reporte-vacio">No hay cuentas pendientes en este período.</div>
        )}
      </section>

      <Modal
        abierto={variacionModal}
        titulo={`Historial de costo: ${variacionProducto?.nombre || ''}`}
        onCerrar={() => {
          setVariacionModal(false);
          setVariacionProducto(null);
        }}
        ancho="800px"
      >
        {variacionProducto && (
          <div>
            <div className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="campo"><span>Producto</span><strong>{variacionProducto.nombre}</strong></div>
              <div className="campo"><span>Código</span><strong>{variacionProducto.codigo}</strong></div>
              <div className="campo"><span>Categoría</span><strong>{variacionProducto.categoria || '—'}</strong></div>
            </div>
            {variacionProducto.datos.length ? (
              <div className="tabla-wrapper">
                <table className="tabla">
                  <thead><tr><th>Fecha</th><th>Factura</th><th>Proveedor</th><th style={{ textAlign: 'right' }}>Cantidad</th><th style={{ textAlign: 'right' }}>Costo unitario</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                  <tbody>
                    {variacionProducto.datos.map((dato) => (
                      <tr key={`${dato.fecha}-${dato.numero_compra}`}>
                        <td>{formatearFecha(dato.fecha)}</td>
                        <td>{dato.numero_compra}</td>
                        <td>{dato.proveedor}</td>
                        <td style={{ textAlign: 'right' }}>{Number(dato.cantidad).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right' }}>{formatearMoneda(dato.costo_unitario)}</td>
                        <td style={{ textAlign: 'right' }}>{formatearMoneda(dato.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="reporte-vacio">No hay datos de costo en este período.</div>}
          </div>
        )}
      </Modal>
    </section>
  );
}
