import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import {
  formatearFecha,
  formatearFechaHora,
  formatearMoneda,
  formatearNumero
} from '../../utils/formatos';

const RESUMEN_INICIAL = {
  totales: {
    productos: 0,
    unidades: 0,
    valor: 0,
    stock_bajo: 0,
    sin_movimiento: 0
  },
  categorias: [],
  stock_bajo: [],
  sin_movimiento: [],
  categoria: null,
  dias_sin_movimiento: 90,
  generado_en: null
};

export default function ReporteInventarioPage() {
  const notificar = useNotificacion();
  const notificarRef = useRef(notificar);
  notificarRef.current = notificar;
  const solicitudActual = useRef(0);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [datos, setDatos] = useState(RESUMEN_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async (categoriaActual = '') => {
    const solicitud = ++solicitudActual.current;
    setCargando(true);
    setError('');
    try {
      const params = categoriaActual ? { categoria: categoriaActual } : {};
      const res = await api.get('/reportes-inventario/resumen', { params });
      if (solicitud !== solicitudActual.current) return;
      setDatos(res.data || RESUMEN_INICIAL);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;
      setError(err.message);
      notificarRef.current.error(err.message);
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    api.get('/productos/categorias')
      .then((res) => {
        if (activo) setCategorias(res.data || []);
      })
      .catch(() => {
        if (activo) setCategorias([]);
      });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    cargarDatos(categoria);
  }, [categoria, cargarDatos]);

  const totales = datos.totales || RESUMEN_INICIAL.totales;
  const valorCategorias = datos.categorias.reduce((suma, item) => suma + Number(item.valor || 0), 0);

  function nombreCategoriaActual() {
    if (!datos.categoria) return 'Todas las categorías';
    return datos.categoria.nombre;
  }

  function textoFiltros() {
    return `Categoría: ${nombreCategoriaActual()} · Productos sin movimiento: más de ${datos.dias_sin_movimiento || 90} días`;
  }

  function exportarCSVReporte() {
    const filas = [
      { Sección: 'Resumen', Concepto: 'Valor del inventario', Cantidad: '', Detalle: formatearMoneda(totales.valor) },
      { Sección: 'Resumen', Concepto: 'Productos activos', Cantidad: totales.productos, Detalle: '' },
      { Sección: 'Resumen', Concepto: 'Unidades en existencia', Cantidad: formatearNumero(totales.unidades, 2), Detalle: '' },
      { Sección: 'Resumen', Concepto: 'Productos con stock bajo', Cantidad: totales.stock_bajo, Detalle: '' },
      { Sección: 'Resumen', Concepto: 'Productos sin movimiento', Cantidad: totales.sin_movimiento, Detalle: `${datos.dias_sin_movimiento} días` },
      ...datos.categorias.map((item) => ({
        Sección: 'Categorías',
        Concepto: item.nombre,
        Cantidad: item.productos,
        Detalle: `${formatearNumero(item.unidades, 2)} unidades · ${formatearMoneda(item.valor)}`
      })),
      ...datos.stock_bajo.map((item) => ({
        Sección: 'Stock bajo',
        Concepto: `${item.codigo} · ${item.nombre}`,
        Cantidad: formatearNumero(item.stock_actual, 2),
        Detalle: `Mínimo ${formatearNumero(item.stock_minimo, 2)} · Faltan ${formatearNumero(item.faltante, 2)}`
      })),
      ...datos.sin_movimiento.map((item) => ({
        Sección: 'Sin movimiento',
        Concepto: `${item.codigo} · ${item.nombre}`,
        Cantidad: formatearNumero(item.stock_actual, 2),
        Detalle: `${item.dias_sin_movimiento} días · Último: ${formatearFecha(item.ultimo_movimiento)}`
      }))
    ];

    const generado = exportarCSV(filas, `reporte_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    if (generado) notificar.exito('CSV generado correctamente');
    else notificar.error('No hay datos para exportar');
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      Categoría: nombreCategoriaActual(),
      Productos: totales.productos,
      Unidades: totales.unidades,
      Valor: totales.valor,
      StockBajo: totales.stock_bajo,
      SinMovimiento: totales.sin_movimiento,
      Generado: formatearFechaHora(datos.generado_en || new Date())
    }]), 'Resumen');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.categorias.map((item) => ({
      Categoría: item.nombre,
      Productos: item.productos,
      Unidades: item.unidades,
      Valor: item.valor
    }))), 'Categorías');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.stock_bajo.map((item) => ({
      Código: item.codigo,
      Producto: item.nombre,
      Categoría: item.categoria_nombre,
      Existencia: item.stock_actual,
      Mínimo: item.stock_minimo,
      Faltante: item.faltante,
      Valor: item.valor
    }))), 'Stock bajo');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.sin_movimiento.map((item) => ({
      Código: item.codigo,
      Producto: item.nombre,
      Categoría: item.categoria_nombre,
      Existencia: item.stock_actual,
      'Último movimiento': item.ultimo_movimiento || '',
      Días: item.dias_sin_movimiento,
      Valor: item.valor
    }))), 'Sin movimiento');

    XLSX.writeFile(wb, `reporte_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notificar.exito('Excel generado correctamente');
  }

async function construirPdfDocumento() {
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
    doc.text('Inventario', tx + 5, 17);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(nombreCategoriaActual(), tx + 5, 23);

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(12, 36, AP - 12, 36);
    doc.setLineWidth(0.1);

    // Barra de filtros: el detalle largo (incluido "sin movimiento") va aquí,
    // en una franja de ancho completo, y no dentro del recuadro del título.
    let y = 39;
    doc.setFillColor(248, 249, 250);
    doc.rect(12, y, AP - 24, 8, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.2);
    doc.line(12, y, 12, y + 8);
    doc.setLineWidth(0.1);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(8.5);
    doc.text('Filtros:', 15, y + 5);
    doc.setTextColor(55, 65, 81);
    const lineasFiltros = doc.splitTextToSize(textoFiltros(), AP - 48);
    doc.text(lineasFiltros, 32, y + 5);
    y += 8 + (lineasFiltros.length - 1) * 4 + 4;

    const titulo = (texto) => {
      if (y > 258) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.text(texto, 14, y);
      y += 4;
    };

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Valor del inventario: ${formatearMoneda(totales.valor)}  |  Productos: ${totales.productos}  |  Unidades: ${formatearNumero(totales.unidades, 2)}`, 14, y);
    y += 6;

    titulo('Distribución por categoría');
    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Productos', 'Unidades', 'Valor']],
      body: datos.categorias.map((item) => [item.nombre, item.productos, formatearNumero(item.unidades, 2), formatearMoneda(item.valor)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 7;
    titulo('Productos con stock bajo');
    autoTable(doc, {
      startY: y,
      head: [['Código', 'Producto', 'Existencia', 'Mínimo', 'Faltante']],
      body: datos.stock_bajo.map((item) => [item.codigo, item.nombre, formatearNumero(item.stock_actual, 2), formatearNumero(item.stock_minimo, 2), formatearNumero(item.faltante, 2)]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    y = doc.lastAutoTable.finalY + 7;
    titulo('Productos sin movimiento');
    autoTable(doc, {
      startY: y,
      head: [['Código', 'Producto', 'Existencia', 'Último movimiento', 'Días']],
      body: datos.sin_movimiento.map((item) => [item.codigo, item.nombre, formatearNumero(item.stock_actual, 2), item.ultimo_movimiento ? formatearFecha(item.ultimo_movimiento) : 'Sin movimientos', item.dias_sin_movimiento]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 2: { halign: 'right' }, 4: { halign: 'right' } }
    });

    let fy = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y;
    if (fy > 286) {
      doc.addPage();
      fy = 20;
    }
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    const ahora = new Date();
    doc.text(`Generado el ${ahora.toLocaleDateString('es-GT')}, ${ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`, 14, fy);

    return doc;
  }

  async function exportarPDF() {
    const doc = await construirPdfDocumento();
    if (!doc) return;
    doc.save(`reporte_inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
    notificar.exito('PDF generado correctamente');
  }

async function imprimirReporte() {
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
    <section className="reporte-compras inventario-reporte">
      <header className="reporte-cabecera">
        <div>
          <h2>Reporte de Inventario</h2>
          <p>Consulta el valor de las existencias, la distribución por categoría y los productos que requieren atención.</p>
        </div>
        <div className="reporte-acciones">
          <button type="button" className="btn btn-secundario" onClick={exportarCSVReporte} disabled={cargando}>CSV</button>
          <button type="button" className="btn btn-secundario" onClick={exportarExcel} disabled={cargando}>Excel</button>
          <button type="button" className="btn btn-secundario" onClick={exportarPDF} disabled={cargando}>PDF</button>
          <button type="button" className="btn btn-primario" onClick={imprimirReporte}>Imprimir</button>
        </div>
      </header>

      <section className="reporte-filtros">
        <div className="inventario-filtro">
          <label className="reporte-campo">
            <span>Categoría</span>
            <select
              className="control"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </select>
          </label>
          <p className="inventario-filtro-ayuda">
            El reporte se actualiza automáticamente al cambiar la categoría.
          </p>
        </div>
      </section>

      {error && <div className="alerta alerta-error">{error}</div>}
      {cargando && <p className="reporte-cargando">Actualizando reporte...</p>}

      <p className="reporte-print-meta">
        {textoFiltros()} · Generado: {formatearFechaHora(datos.generado_en || new Date())}
      </p>

      <div className="reporte-kpis">
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Valor del inventario</span>
          <strong className="reporte-kpi-valor">{formatearMoneda(totales.valor)}</strong>
          <span className="reporte-kpi-ayuda">Existencias valorizadas al costo promedio.</span>
        </article>
        <article className="reporte-kpi">
          <span className="reporte-kpi-etiqueta">Productos activos</span>
          <strong className="reporte-kpi-valor">{formatearNumero(totales.productos, 0)}</strong>
          <span className="reporte-kpi-ayuda">{formatearNumero(totales.unidades, 2)} unidades en existencia.</span>
        </article>
        <article className={`reporte-kpi${Number(totales.stock_bajo) > 0 ? ' reporte-kpi-pendiente' : ''}`}>
          <span className="reporte-kpi-etiqueta">Stock bajo</span>
          <strong className="reporte-kpi-valor">{formatearNumero(totales.stock_bajo, 0)}</strong>
          <span className="reporte-kpi-ayuda">Productos en o por debajo del mínimo.</span>
        </article>
        <article className={`reporte-kpi${Number(totales.sin_movimiento) > 0 ? ' reporte-kpi-pendiente' : ''}`}>
          <span className="reporte-kpi-etiqueta">Sin movimiento</span>
          <strong className="reporte-kpi-valor">{formatearNumero(totales.sin_movimiento, 0)}</strong>
          <span className="reporte-kpi-ayuda">Sin movimientos en los últimos {datos.dias_sin_movimiento} días.</span>
        </article>
      </div>

      <section className="reporte-panel reporte-seccion">
        <div className="reporte-panel-header">
          <div>
            <h3>Distribución por categoría</h3>
            <p>Valor de las existencias agrupado por categoría.</p>
          </div>
        </div>
        {datos.categorias.length ? (
          <div className="reporte-tabla-wrapper">
            <table className="tabla reporte-tabla">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th className="reporte-numero">Productos</th>
                  <th className="reporte-numero">Unidades</th>
                  <th className="reporte-numero">Valor</th>
                  <th className="reporte-numero">Participación</th>
                </tr>
              </thead>
              <tbody>
                {datos.categorias.map((item) => {
                  const porcentaje = valorCategorias > 0 ? (Number(item.valor) / valorCategorias) * 100 : 0;
                  return (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td className="reporte-numero">{formatearNumero(item.productos, 0)}</td>
                      <td className="reporte-numero">{formatearNumero(item.unidades, 2)}</td>
                      <td className="reporte-numero">{formatearMoneda(item.valor)}</td>
                      <td className="reporte-numero">{porcentaje.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reporte-vacio">No hay productos activos para la categoría seleccionada.</div>
        )}
      </section>

      <section className="reporte-doble">
        <article className="reporte-panel">
          <div className="reporte-panel-header">
            <div>
              <h4>Productos con stock bajo</h4>
              <p>Existencias iguales o menores al mínimo configurado.</p>
            </div>
          </div>
          {datos.stock_bajo.length ? (
            <div className="reporte-tabla-wrapper">
              <table className="tabla reporte-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="reporte-numero">Existencia</th>
                    <th className="reporte-numero">Mínimo</th>
                    <th className="reporte-numero">Faltante</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.stock_bajo.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.codigo}</strong>
                        <span className="inventario-producto-nombre">{item.nombre}</span>
                      </td>
                      <td className="reporte-numero">{formatearNumero(item.stock_actual, 2)}</td>
                      <td className="reporte-numero">{formatearNumero(item.stock_minimo, 2)}</td>
                      <td className="reporte-numero inventario-faltante">{formatearNumero(item.faltante, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="reporte-vacio">No hay productos con stock bajo.</div>
          )}
        </article>

        <article className="reporte-panel">
          <div className="reporte-panel-header">
            <div>
              <h4>Sin movimiento reciente</h4>
              <p>Productos sin entradas ni salidas en más de {datos.dias_sin_movimiento} días.</p>
            </div>
          </div>
          {datos.sin_movimiento.length ? (
            <div className="reporte-tabla-wrapper">
              <table className="tabla reporte-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="reporte-numero">Existencia</th>
                    <th>Último movimiento</th>
                    <th className="reporte-numero">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.sin_movimiento.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.codigo}</strong>
                        <span className="inventario-producto-nombre">{item.nombre}</span>
                      </td>
                      <td className="reporte-numero">{formatearNumero(item.stock_actual, 2)}</td>
                      <td>{item.ultimo_movimiento ? formatearFecha(item.ultimo_movimiento) : 'Sin movimientos'}</td>
                      <td className="reporte-numero">{item.dias_sin_movimiento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="reporte-vacio">Todos los productos tienen movimientos recientes.</div>
          )}
        </article>
      </section>
    </section>
  );
}
