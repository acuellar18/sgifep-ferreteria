import { useCallback, useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FILTROS_INICIALES = {
  startDate: '',
  endDate: '',
  proveedor: '',
  categoria: ''
};

export default function ReporteComprasPage() {
  const notificar = useNotificacion();

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState({ total_comprado: 0, num_compras: 0, promedio_compra: 0, total_por_pagar: 0 });
  const [comprasPorMes, setComprasPorMes] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [productosMasComprados, setProductosMasComprados] = useState([]);
  const [cuentasPorPagar, setCuentasPorPagar] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [variacionProducto, setVariacionProducto] = useState(null);
  const [productoVariacionId, setProductoVariacionId] = useState('');
  const [variacionModal, setVariacionModal] = useState(false);
  const temporizadorBusqueda = useRef(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [k, v] of Object.entries(filtros)) if (v) params[k] = v;
      const [resResumen, resMes, resTop, resProd, resCuentas] = await Promise.all([
        api.get('/reportes-compras/resumen', { params }),
        api.get('/reportes-compras/compras-por-mes', { params }),
        api.get('/reportes-compras/top-proveedores', { params }),
        api.get('/reportes-compras/productos-mas-comprados', { params: { ...params, limite: 10 } }),
        api.get('/reportes-compras/cuentas-por-pagar', { params })
      ]);
      setResumen(resResumen.data);
      setComprasPorMes(resMes.data);
      setTopProveedores(resTop.data);
      setProductosMasComprados(resProd.data);
      setCuentasPorPagar(resCuentas.data);
    } catch (err) {
      setError(err.message);
      notificar.error(err.message);
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [resProv, resCat] = await Promise.all([
        api.get('/proveedores/resumen?estado=activo'),
        api.get('/reportes-compras/categorias')
      ]);
      setProveedores(resProv.data);
      setCategorias(resCat.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    cargarCatalogos();
    cargarDatos();
  }, [cargarDatos, cargarCatalogos]);

  function cambiarFiltros(nuevos) {
    const cambiaFecha = nuevos.startDate !== filtros.startDate || nuevos.endDate !== filtros.endDate;
    setFiltros(nuevos);
    if (cambiaFecha) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => cargarDatos(), 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    cargarDatos();
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    cargarDatos();
  }

  function atajosFecha(dias) {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - dias);
    setFiltros(prev => ({
      ...prev,
      startDate: inicio.toISOString().split('T')[0],
      endDate: hoy.toISOString().split('T')[0]
    }));
  }

  async function verVariacionCosto(producto) {
    setProductoVariacionId(producto.id);
    try {
      const res = await api.get(`/reportes-compras/variacion-costo/${producto.id}`, {
        params: { startDate: filtros.startDate, endDate: filtros.endDate }
      });
      setVariacionProducto({ ...producto, datos: res.data });
      setVariacionModal(true);
    } catch (err) {
      notificar.error(err.message);
    }
  }

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', minimumFractionDigits: 2 }).format(valor);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-GT');
  }

  // Chart data
  const doughnutData = {
    labels: topProveedores.map(p => p.nombre),
    datasets: [{ data: topProveedores.map(p => p.total_comprado), backgroundColor: ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'] }]
  };
  const barData = {
    labels: comprasPorMes.map(m => m.mes),
    datasets: [{ label: 'Total compras (Q)', data: comprasPorMes.map(m => m.total), backgroundColor: '#ea580c' }]
  };

  // Export functions
  function exportarExcel() {
    const wb = XLSX.utils.book_new();
    // Resumen
    const wsResumen = XLSX.utils.json_to_sheet([{
      'Total comprado': formatearMoneda(resumen.total_comprado),
      'N° compras': resumen.num_compras,
      'Promedio/compra': formatearMoneda(resumen.promedio_compra),
      'Total por pagar': formatearMoneda(resumen.total_por_pagar)
    }]);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    // Compras por mes
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comprasPorMes.map(m => ({ Mes: m.mes, Compras: m.cantidad, Total: formatearMoneda(m.total) }))), 'Compras por mes');
    // Top proveedores
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProveedores.map(p => ({ Proveedor: p.nombre, Compras: p.num_compras, Total: formatearMoneda(p.total_comprado) }))), 'Top Proveedores');
    // Productos más comprados
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productosMasComprados.map(p => ({ Código: p.codigo, Producto: p.nombre, Cantidad: p.cantidad_total, Total: formatearMoneda(p.total_comprado), CostoPromedio: formatearMoneda(p.costo_promedio) }))), 'Productos');
    // Cuentas por pagar
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cuentasPorPagar.map(c => ({ NCompra: c.numero, Proveedor: c.proveedor_nombre, Fecha: c.fecha, Vencimiento: c.fecha_vencimiento, Total: formatearMoneda(c.total), Saldo: formatearMoneda(c.saldo_pendiente), Estado: c.estado_pago, Dias: c.dias_restantes }))), 'Cuentas por pagar');
    XLSX.writeFile(wb, `reporte_compras_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Compras - Ferretería El Puente', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')} | Filtros: ${filtros.startDate || 'inicio'} a ${filtros.endDate || 'hoy'}`, 14, 28);

    // Resumen
    doc.setFontSize(12);
    doc.text('Resumen', 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total comprado', formatearMoneda(resumen.total_comprado)],
        ['N° compras', resumen.num_compras],
        ['Promedio/compra', formatearMoneda(resumen.promedio_compra)],
        ['Total por pagar', formatearMoneda(resumen.total_por_pagar)]
      ]
    });

    // Compras por mes
    doc.text('Compras por mes', 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Mes', 'Compras', 'Total']],
      body: comprasPorMes.map(m => [m.mes, m.cantidad, formatearMoneda(m.total)])
    });

    // Top proveedores
    doc.text('Top 5 Proveedores', 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Proveedor', 'Compras', 'Total']],
      body: topProveedores.map(p => [p.nombre, p.num_compras, formatearMoneda(p.total_comprado)])
    });

    // Productos más comprados
    doc.text('Top 10 Productos más comprados', 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Código', 'Producto', 'Cantidad', 'Total', 'Costo prom.']],
      body: productosMasComprados.map(p => [p.codigo, p.nombre, p.cantidad_total.toLocaleString('es-GT'), formatearMoneda(p.total_comprado), formatearMoneda(p.costo_promedio)])
    });

    // Cuentas por pagar
    doc.text('Cuentas por pagar (vencimientos)', 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['N° Compra', 'Proveedor', 'Fecha', 'Vence', 'Total', 'Saldo', 'Días']],
      body: cuentasPorPagar.map(c => [c.numero, c.proveedor_nombre, c.fecha, c.fecha_vencimiento, formatearMoneda(c.total), formatearMoneda(c.saldo_pendiente), c.dias_restantes])
    });

    doc.save(`reporte_compras_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  const chipVencimiento = (estado) => {
    const estilos = {
      vencida: 'chip-peligro',
      hoy: 'chip-peligro',
      por_vencer: 'chip-rol',
      pagada: 'chip-ok',
      normal: 'chip-ok'
    };
    const labels = { vencida: 'VENCIDA', hoy: 'HOY', por_vencer: 'POR VENCER', pagada: 'PAGADA', normal: 'Normal' };
    return <span className={`chip ${estilos[estado] || 'chip'}`}>{labels[estado] || estado}</span>;
  };

  if (cargando) return <p className="estado">Cargando reporte...</p>;

  return (
    <section className="reporte-imprimible">
      <div className="encabezado-pagina">
        <h2>Reporte de Compras</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={() => window.print()}>Imprimir</button>
          <button type="button" className="btn btn-primario" onClick={exportarExcel}>Exportar Excel</button>
          <button type="button" className="btn btn-secundario" onClick={exportarPDF}>Exportar PDF</button>
        </div>
      </div>

      <FilterBar
        filtros={filtros}
        departamentos={[]}
        roles={[]}
        onChange={cambiarFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      >
        <select className="control" value={filtros.proveedor} onChange={(e) => cambiarFiltros({ ...filtros, proveedor: e.target.value })}>
          <option value="">Proveedor: todos</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select className="control" value={filtros.categoria} onChange={(e) => cambiarFiltros({ ...filtros, categoria: e.target.value })}>
          <option value="">Categoría: todas</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input type="date" className="control" value={filtros.startDate} onChange={(e) => cambiarFiltros({ ...filtros, startDate: e.target.value })} />
        <input type="date" className="control" value={filtros.endDate} onChange={(e) => cambiarFiltros({ ...filtros, endDate: e.target.value })} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" className="btn btn-opcion" onClick={() => atajosFecha(0)} style={{fontSize:'11px',padding:'6px 8px'}}>Hoy</button>
          <button type="button" className="btn btn-opcion" onClick={() => atajosFecha(6)} style={{fontSize:'11px',padding:'6px 8px'}}>Semana</button>
          <button type="button" className="btn btn-opcion" onClick={() => atajosFecha(29)} style={{fontSize:'11px',padding:'6px 8px'}}>Mes</button>
          <button type="button" className="btn btn-opcion" onClick={() => atajosFecha(364)} style={{fontSize:'11px',padding:'6px 8px'}}>Año</button>
        </div>
      </FilterBar>

      {error && <div className="alerta alerta-error">{error}</div>}

      <div className="tarjetas">
        <div className="tarjeta"><span className="tarjeta-valor">{formatearMoneda(resumen.total_comprado)}</span><span className="tarjeta-etiqueta">Total comprado</span></div>
        <div className="tarjeta"><span className="tarjeta-valor">{resumen.num_compras}</span><span className="tarjeta-etiqueta">N° de compras</span></div>
        <div className="tarjeta"><span className="tarjeta-valor">{formatearMoneda(resumen.promedio_compra)}</span><span className="tarjeta-etiqueta">Promedio/compra</span></div>
        <div className="tarjeta tarjeta-peligro"><span className="tarjeta-valor">{formatearMoneda(resumen.total_por_pagar)}</span><span className="tarjeta-etiqueta">Total por pagar</span></div>
      </div>

      <div className="reporte-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <h3>Compras por mes</h3>
          {comprasPorMes.length ? (
            <div style={{ height: '300px' }}><Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} /></div>
          ) : <p className="estado">Sin datos</p>}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <h3>Top 5 Proveedores</h3>
          {topProveedores.length ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            </div>
          ) : <p className="estado">Sin datos</p>}
        </div>
        <div>
          <h3>Top 10 Productos más comprados</h3>
          {productosMasComprados.length ? (
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead><tr><th>Código</th><th>Producto</th><th style={{textAlign:'right'}}>Cantidad</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Costo prom.</th><th></th></tr></thead>
                <tbody>
                  {productosMasComprados.map(p => (
                    <tr key={p.id}>
                      <td>{p.codigo}</td><td>{p.nombre}</td>
                      <td style={{textAlign:'right'}}>{p.cantidad_total.toLocaleString('es-GT', {minimumFractionDigits: 2})} {p.unidad_medida}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(p.total_comprado)}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(p.costo_promedio)}</td>
                      <td><button className="btn btn-opcion" style={{padding:'4px 8px',fontSize:'12px'}} onClick={() => verVariacionCosto(p)}>Ver variación</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="estado">Sin datos</p>}
        </div>
        <div>
          <h3>Cuentas por pagar / Vencimientos</h3>
          {cuentasPorPagar.length ? (
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead><tr><th>N° Compra</th><th>Proveedor</th><th>Fecha</th><th>Vence</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Saldo</th><th>Estado</th></tr></thead>
                <tbody>
                  {cuentasPorPagar.map(c => (
                    <tr key={c.id} style={{background: c.estado_vencimiento === 'vencida' ? '#fee2e2' : c.estado_vencimiento === 'por_vencer' ? '#fff7ed' : 'transparent'}}>
                      <td>{c.numero}</td><td>{c.proveedor_nombre}</td><td>{formatearFecha(c.fecha)}</td><td>{formatearFecha(c.fecha_vencimiento)}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(c.total)}</td>
                      <td style={{textAlign:'right'}}>{formatearMoneda(c.saldo_pendiente)}</td>
                      <td>{chipVencimiento(c.estado_vencimiento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="estado">Sin cuentas por pagar</p>}
        </div>
      </div>

      <Modal abierto={variacionModal} titulo={`Variación de costo: ${variacionProducto?.nombre || ''}`} onCerrar={() => { setVariacionModal(false); setVariacionProducto(null); setProductoVariacionId(''); }} ancho="800px">
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
                  <thead><tr><th>Fecha</th><th>N° Compra</th><th>Proveedor</th><th style={{textAlign:'right'}}>Cantidad</th><th style={{textAlign:'right'}}>Costo unit.</th><th style={{textAlign:'right'}}>Subtotal</th></tr></thead>
                  <tbody>
                    {variacionProducto.datos.map(d => (
                      <tr key={d.fecha + d.numero_compra}>
                        <td>{formatearFecha(d.fecha)}</td><td>{d.numero_compra}</td><td>{d.proveedor}</td>
                        <td style={{textAlign:'right'}}>{Number(d.cantidad).toLocaleString('es-GT', {minimumFractionDigits: 2})}</td>
                        <td style={{textAlign:'right'}}>{formatearMoneda(d.costo_unitario)}</td>
                        <td style={{textAlign:'right'}}>{formatearMoneda(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="estado">Sin datos de variación en el período</p>}
          </div>
        )}
      </Modal>
    </section>
  );
}