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

  function exportarPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de ventas', 14, 18);
    doc.setFontSize(9);
    doc.text(`Del ${aplicados.desde} al ${aplicados.hasta}`, 14, 25);

    autoTable(doc, {
      startY: 31,
      head: [['Indicador', 'Valor']],
      body: filasResumen().map((fila) => [fila.Indicador, String(fila.Valor)]),
      theme: 'striped',
      styles: { fontSize: 8 }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
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
      styles: { fontSize: 8 }
    });

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
          <button type="button" className="btn btn-primario" onClick={exportarPdf}>PDF</button>
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
