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
      { Seccion: 'Resumen', Concepto: 'Valor del inventario', Cantidad: '', Detalle: formatearMoneda(totales.valor) },
      { Seccion: 'Resumen', Concepto: 'Productos activos', Cantidad: totales.productos, Detalle: '' },
      { Seccion: 'Resumen', Concepto: 'Unidades en existencia', Cantidad: formatearNumero(totales.unidades, 2), Detalle: '' },
      { Seccion: 'Resumen', Concepto: 'Productos con stock bajo', Cantidad: totales.stock_bajo, Detalle: '' },
      { Seccion: 'Resumen', Concepto: 'Productos sin movimiento', Cantidad: totales.sin_movimiento, Detalle: `${datos.dias_sin_movimiento} días` },
      ...datos.categorias.map((item) => ({
        Seccion: 'Categorías',
        Concepto: item.nombre,
        Cantidad: item.productos,
        Detalle: `${formatearNumero(item.unidades, 2)} unidades · ${formatearMoneda(item.valor)}`
      })),
      ...datos.stock_bajo.map((item) => ({
        Seccion: 'Stock bajo',
        Concepto: `${item.codigo} · ${item.nombre}`,
        Cantidad: formatearNumero(item.stock_actual, 2),
        Detalle: `Mínimo ${formatearNumero(item.stock_minimo, 2)} · Faltan ${formatearNumero(item.faltante, 2)}`
      })),
      ...datos.sin_movimiento.map((item) => ({
        Seccion: 'Sin movimiento',
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
      Categoria: nombreCategoriaActual(),
      Productos: totales.productos,
      Unidades: totales.unidades,
      Valor: totales.valor,
      StockBajo: totales.stock_bajo,
      SinMovimiento: totales.sin_movimiento,
      Generado: formatearFechaHora(datos.generado_en || new Date())
    }]), 'Resumen');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.categorias.map((item) => ({
      Categoria: item.nombre,
      Productos: item.productos,
      Unidades: item.unidades,
      Valor: item.valor
    }))), 'Categorias');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.stock_bajo.map((item) => ({
      Codigo: item.codigo,
      Producto: item.nombre,
      Categoria: item.categoria_nombre,
      Existencia: item.stock_actual,
      Minimo: item.stock_minimo,
      Faltante: item.faltante,
      Valor: item.valor
    }))), 'Stock bajo');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datos.sin_movimiento.map((item) => ({
      Codigo: item.codigo,
      Producto: item.nombre,
      Categoria: item.categoria_nombre,
      Existencia: item.stock_actual,
      UltimoMovimiento: item.ultimo_movimiento || '',
      Dias: item.dias_sin_movimiento,
      Valor: item.valor
    }))), 'Sin movimiento');

    XLSX.writeFile(wb, `reporte_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
    notificar.exito('Excel generado correctamente');
  }

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(17);
    doc.text('Reporte de Inventario', 14, 18);
    doc.setFontSize(9);
    doc.text(`${textoFiltros()} | Generado: ${formatearFechaHora(datos.generado_en || new Date())}`, 14, 26);
    doc.setFontSize(11);
    doc.text(`Valor del inventario: ${formatearMoneda(totales.valor)} | Productos: ${totales.productos} | Unidades: ${formatearNumero(totales.unidades, 2)}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [['Categoría', 'Productos', 'Unidades', 'Valor']],
      body: datos.categorias.map((item) => [
        item.nombre,
        item.productos,
        formatearNumero(item.unidades, 2),
        formatearMoneda(item.valor)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Código', 'Producto', 'Existencia', 'Mínimo', 'Faltante']],
      body: datos.stock_bajo.map((item) => [
        item.codigo,
        item.nombre,
        formatearNumero(item.stock_actual, 2),
        formatearNumero(item.stock_minimo, 2),
        formatearNumero(item.faltante, 2)
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [234, 88, 12] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Código', 'Producto', 'Existencia', 'Último movimiento', 'Días']],
      body: datos.sin_movimiento.map((item) => [
        item.codigo,
        item.nombre,
        formatearNumero(item.stock_actual, 2),
        formatearFecha(item.ultimo_movimiento),
        item.dias_sin_movimiento
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [234, 88, 12] }
    });

    doc.save(`reporte_inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
    notificar.exito('PDF generado correctamente');
  }

  return (
    <section className="reporte-compras inventario-reporte">
      <header className="reporte-cabecera">
        <div>
          <h2>Reporte de Inventario</h2>
          <p>Consulta el valor de las existencias, la distribución por categoría y los productos que requieren atención.</p>
        </div>
        <div className="reporte-acciones">
          <details className="reporte-opciones">
            <summary className="btn btn-secundario">Opciones <span aria-hidden="true">▾</span></summary>
            <div className="reporte-opciones-menu">
              <button type="button" onClick={exportarExcel} disabled={cargando}>Exportar Excel</button>
              <button type="button" onClick={exportarPDF} disabled={cargando}>Exportar PDF</button>
              <button type="button" onClick={exportarCSVReporte} disabled={cargando}>Exportar CSV</button>
              <button type="button" onClick={() => window.print()}>Imprimir</button>
            </div>
          </details>
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
