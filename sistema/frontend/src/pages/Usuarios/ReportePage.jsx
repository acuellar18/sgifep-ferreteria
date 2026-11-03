import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/Modal';
import { useNotificacion } from '../../components/Toast';
import exportarCSV from '../../utils/csv';
import { formatearFecha } from '../../utils/formatos';

const FILTROS_INICIALES = {
  q: '',
  estado: 'todos',
  departamento: '',
  rol: '',
  startDate: '',
  endDate: ''
};

// Reporte "inteligente": un único lugar de verdad para reportes de usuarios.
// Antes existían dos reportes desconectados (esta página, con estadísticas
// globales sin filtro, y un modal en el Listado con la tabla ya filtrada
// pero sin estadísticas). Ahora ambos casos se resuelven aquí: mismos
// filtros que el Listado (búsqueda, estado, departamento, rol, fechas),
// aplicados tanto a los totales como a los desgloses.
export default function ReportePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const notificar = useNotificacion();

  // Los filtros iniciales se leen de la URL para que el enlace "Reporte de
  // Usuarios" del Listado llegue aquí con el mismo criterio ya aplicado.
  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_INICIALES,
    ...Object.fromEntries(searchParams.entries())
  }));
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null); // { tipo: 'departamento'|'rol', id, nombre, usuarios, cargando }
  const temporizadorBusqueda = useRef(null);

  const cargarReporte = useCallback(async (filtrosActuales) => {
    setCargando(true);
    setError('');
    try {
      const params = {};
      for (const [clave, valor] of Object.entries(filtrosActuales)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
          params[clave] = valor;
        }
      }
      const res = await api.get('/usuarios/reporte', { params });
      setReporte(res.data);
    } catch (err) {
      setReporte(null);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarOpciones = useCallback(async () => {
    const [resDeptos, resRoles] = await Promise.all([
      api.get('/departamentos?estado=activo'),
      api.get('/roles?estado=activo')
    ]);
    setDepartamentos(resDeptos.data);
    setRoles(resRoles.data);
  }, []);

  useEffect(() => {
    cargarOpciones().catch((e) => setError(e.message));
    cargarReporte(filtros);
    // Solo se ejecuta al montar: los filtros iniciales ya vienen de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sincronizarUrl(nuevos) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(nuevos)) {
      if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
        params.set(clave, valor);
      }
    }
    setSearchParams(params, { replace: true });
  }

  function cambiarFiltros(nuevos) {
    const cambiaTexto = nuevos.q !== filtros.q;
    setFiltros(nuevos);
    if (cambiaTexto) {
      clearTimeout(temporizadorBusqueda.current);
      temporizadorBusqueda.current = setTimeout(() => {
        sincronizarUrl(nuevos);
        cargarReporte(nuevos);
      }, 400);
    }
  }

  useEffect(() => () => clearTimeout(temporizadorBusqueda.current), []);

  function aplicarFiltros(e) {
    e.preventDefault();
    clearTimeout(temporizadorBusqueda.current);
    sincronizarUrl(filtros);
    cargarReporte(filtros);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    sincronizarUrl(FILTROS_INICIALES);
    cargarReporte(FILTROS_INICIALES);
  }

  // Modal de detalle: al hacer clic en una fila de "por departamento" o "por
  // rol" se listan los usuarios activos de esa categoría, respetando además
  // el resto de filtros ya aplicados (fecha, búsqueda, etc.).
  async function verDetalle(tipo, id, nombre) {
    setDetalle({ tipo, id, nombre, usuarios: [], cargando: true });
    try {
      const params = { estado: 'activo' };
      for (const [clave, valor] of Object.entries(filtros)) {
        if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined && clave !== 'estado') {
          params[clave] = valor;
        }
      }
      params[tipo === 'departamento' ? 'departamento' : 'rol'] = id;
      const res = await api.get('/usuarios', { params: { ...params, pageSize: 100 } });
      setDetalle({ tipo, id, nombre, usuarios: res.data, cargando: false });
    } catch (err) {
      notificar.error(err.message);
      setDetalle(null);
    }
  }

  // Exporta todos los bloques del reporte (con los filtros ya aplicados) a
  // CSV con UTF-8 + BOM (exportarCSV) para que Excel muestre bien las tildes.
  function exportarCsv() {
    if (!reporte) return;
    const { totales, porDepartamento, porRol, usuarios } = reporte;
    const filas = [];
    filas.push({
      Sección: 'TOTALES',
      Código: '',
      Nombre: 'General',
      Departamento: '',
      Rol: '',
      Estado: `${totales.activos} activos / ${totales.inactivos} inactivos`,
      Fecha: '',
      Activos: Number(totales.activos)
    });
    porDepartamento.forEach((d) => {
      filas.push({
        Sección: 'POR DEPARTAMENTO',
        Código: '',
        Nombre: d.nombre,
        Departamento: '',
        Rol: '',
        Estado: '',
        Fecha: '',
        Activos: Number(d.total_activos)
      });
    });
    porRol.forEach((r) => {
      filas.push({
        Sección: 'POR ROL',
        Código: '',
        Nombre: r.nombre,
        Departamento: '',
        Rol: r.acceso_total ? 'Acceso total' : '',
        Estado: '',
        Fecha: '',
        Activos: Number(r.total_activos)
      });
    });
    (usuarios || []).forEach((u) => {
      filas.push({
        Sección: 'USUARIO',
        Código: u.codigo || '',
        Nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        Departamento: u.departamento_nombre || '',
        Rol: (u.roles || []).join(' | '),
        Estado: u.activo ? 'Activo' : 'Inactivo',
        Fecha: String(u.creado_en || '').slice(0, 10),
        Activos: ''
      });
    });
    exportarCSV(filas, `reporte_usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function textoPeriodo() {
    if (filtros.startDate && filtros.endDate) {
      return `Del ${formatearFecha(filtros.startDate)} al ${formatearFecha(filtros.endDate)}`;
    }
    if (filtros.startDate) return `Desde ${formatearFecha(filtros.startDate)}`;
    if (filtros.endDate) return `Hasta ${formatearFecha(filtros.endDate)}`;
    return 'Todos los registros';
  }

  function textoFiltros() {
    const partes = [];
    if (filtros.q) partes.push(`Búsqueda: "${filtros.q}"`);
    if (filtros.estado === 'activo') partes.push('Estado: Solamente activos');
    else if (filtros.estado === 'inactivo') partes.push('Estado: Solamente inactivos');
    const depto = departamentos.find((d) => String(d.id) === String(filtros.departamento));
    if (depto) partes.push(`Departamento: ${depto.nombre}`);
    const rol = roles.find((r) => String(r.id) === String(filtros.rol));
    if (rol) partes.push(`Rol: ${rol.nombre}`);
    if (partes.length === 0) partes.push('Sin filtros aplicados');
    return partes.join(' · ');
  }

  // Construye el PDF del reporte (mismo formato que el Reporte General: logo
  // y nombre de la empresa, línea y acentos verdes, tablas antracita).
  async function construirPdfDocumento() {
    if (!reporte) return;
    const { totales, porDepartamento, porRol, usuarios } = reporte;
    const doc = new jsPDF();
    const AP = 210;

    let logoB64 = null;
    try {
      const r = await fetch('/img/logo.png');
      const b = await r.arrayBuffer();
      const u = new Uint8Array(b);
      let s = '';
      u.forEach((v) => { s += String.fromCharCode(v); });
      logoB64 = `data:image/png;base64,${btoa(s)}`;
    } catch {
      logoB64 = null;
    }

    if (logoB64) {
      doc.addImage(logoB64, 'PNG', 12, 4, 22, 14);
    }
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
    doc.text('Reporte de usuarios', tx + 5, 17);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(textoPeriodo(), tx + 5, 23);

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(12, 36, AP - 12, 36);
    doc.setLineWidth(0.1);

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
    const lineasFiltros = doc.splitTextToSize(textoFiltros(), AP - 44);
    doc.text(lineasFiltros, 32, y + 4.5);
    y += 6 + lineasFiltros.length * 4 + 2;

    const estiloCabecera = {
      fillColor: [20, 20, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7
    };
    const estiloTabla = {
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.2 },
      headStyles: estiloCabecera,
      alternateRowStyles: { fillColor: [248, 249, 250] }
    };

    autoTable(doc, {
      ...estiloTabla,
      startY: y,
      head: [['Resumen', 'Cantidad']],
      body: [
        ['Total de usuarios (según filtros)', String(totales.total)],
        ['Activos', String(totales.activos)],
        ['Inactivos', String(totales.inactivos)]
      ],
      columnStyles: { 1: { halign: 'right' } }
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.text('Usuarios activos por departamento', 14, y);
    y += 4;
    autoTable(doc, {
      ...estiloTabla,
      startY: y,
      head: [['Departamento', 'Activos']],
      body: porDepartamento.length
        ? porDepartamento.map((d) => [d.nombre, String(d.total_activos)])
        : [['Sin datos', '—']],
      columnStyles: { 1: { halign: 'right' } }
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.text('Usuarios activos por rol', 14, y);
    y += 4;
    autoTable(doc, {
      ...estiloTabla,
      startY: y,
      head: [['Rol', 'Acceso total', 'Activos']],
      body: porRol.length
        ? porRol.map((r) => [r.nombre, r.acceso_total ? 'Sí' : 'No', String(r.total_activos)])
        : [['Sin datos', '—', '—']],
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } }
    });
    y = doc.lastAutoTable.finalY + 6;

    if (usuarios?.length) {
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(10);
      doc.text('Listado detallado de usuarios', 14, y);
      y += 4;
      autoTable(doc, {
        ...estiloTabla,
        startY: y,
        head: [['Código', 'Nombre completo', 'Departamento', 'Rol', 'Estado', 'Fecha']],
        body: usuarios.map((u) => [
          u.codigo || '—',
          `${u.nombre || ''} ${u.apellido || ''}`.trim() || '—',
          u.departamento_nombre || '—',
          (u.roles || []).join(', ') || '—',
          u.activo ? 'Activo' : 'Inactivo',
          formatearFecha(u.creado_en)
        ]),
        styles: { fontSize: 7.5, cellPadding: 1.2 },
        headStyles: estiloCabecera,
        alternateRowStyles: { fillColor: [248, 249, 250] }
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    const fechaGen = new Date().toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i += 1) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(`Ferretería El Puente · Reporte de usuarios · Generado el ${fechaGen}`, 14, 289);
      doc.text(`Página ${i} de ${totalPaginas}`, AP - 14, 289, { align: 'right' });
    }

    return doc;
  }

  async function exportarPdf() {
    const doc = await construirPdfDocumento();
    if (!doc) return;
    doc.save(`reporte_usuarios_${new Date().toISOString().slice(0, 10)}.pdf`);
    notificar.exito('PDF descargado');
  }

  // Abre el PDF del reporte en una ventana nueva. Al visor de PDF del navegador
  // se le puede dar Imprimir sin bloquear la aplicación principal.
  async function abrirImpresion() {
    if (!reporte) return;
    try {
      const doc = await construirPdfDocumento();
      if (!doc) return;
      const url = URL.createObjectURL(doc.output('blob'));
      const ventana = window.open(url, '_blank');
      if (ventana) {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        URL.revokeObjectURL(url);
        notificar.error('Permite la ventana emergente para imprimir');
      }
    } catch {
      notificar.error('No se pudo abrir la ventana de impresión');
    }
  }

  return (
    <section className="reporte-imprimible">
      <div className="encabezado-pagina">
        <h2>Reporte de usuarios</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={exportarCsv} disabled={!reporte}>
            Exportar CSV
          </button>
          <button type="button" className="btn btn-secundario" onClick={exportarPdf} disabled={!reporte}>
            PDF
          </button>
          <button type="button" className="btn btn-primario" onClick={abrirImpresion}>
            Imprimir
          </button>
        </div>
      </div>

      <FilterBar
        filtros={filtros}
        departamentos={departamentos}
        roles={roles}
        onChange={cambiarFiltros}
        onFiltrar={aplicarFiltros}
        onLimpiar={limpiarFiltros}
      />

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <p className="estado">Cargando reporte...</p>
      ) : reporte ? (
        <>
          <div className="tarjetas">
            <div className="tarjeta">
              <span className="tarjeta-valor">{reporte.totales.total}</span>
              <span className="tarjeta-etiqueta">Total de usuarios (según filtros)</span>
            </div>
            <div className="tarjeta tarjeta-ok">
              <span className="tarjeta-valor">{reporte.totales.activos}</span>
              <span className="tarjeta-etiqueta">Activos</span>
            </div>
            <div className="tarjeta tarjeta-peligro">
              <span className="tarjeta-valor">{reporte.totales.inactivos}</span>
              <span className="tarjeta-etiqueta">Inactivos</span>
            </div>
          </div>

          <p className="reporte-nota">
            Haz clic en una fila para ver el detalle de esos usuarios.
          </p>

          <div className="reporte-grid">
            <div>
              <h3>Usuarios activos por departamento</h3>
              {reporte.porDepartamento.length === 0 ? (
                <p className="estado">Sin datos.</p>
              ) : (
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Departamento</th>
                        <th>Activos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.porDepartamento.map((d) => (
                        <tr
                          key={d.id}
                          className="fila-clicable"
                          onClick={() => verDetalle('departamento', d.id, d.nombre)}
                        >
                          <td>{d.nombre}</td>
                          <td>{Number(d.total_activos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3>Usuarios activos por rol</h3>
              {reporte.porRol.length === 0 ? (
                <p className="estado">Sin datos.</p>
              ) : (
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Rol</th>
                        <th>Acceso total</th>
                        <th>Activos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.porRol.map((r) => (
                        <tr
                          key={r.id}
                          className="fila-clicable"
                          onClick={() => verDetalle('rol', r.id, r.nombre)}
                        >
                          <td>{r.nombre}</td>
                          <td>{r.acceso_total ? 'Sí' : 'No'}</td>
                          <td>{Number(r.total_activos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <Modal
        abierto={Boolean(detalle)}
        titulo={detalle ? `Usuarios activos · ${detalle.tipo === 'departamento' ? 'Departamento' : 'Rol'}: ${detalle.nombre}` : ''}
        onCerrar={() => setDetalle(null)}
        ancho="700px"
      >
        {detalle?.cargando ? (
          <p className="estado">Cargando usuarios...</p>
        ) : !detalle || detalle.usuarios.length === 0 ? (
          <p className="estado">No hay usuarios activos en esta categoría con los filtros aplicados.</p>
        ) : (
          <div className="tabla-wrapper">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre completo</th>
                  <th>Usuario</th>
                  <th>Departamento</th>
                </tr>
              </thead>
              <tbody>
                {detalle.usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.codigo || '—'}</td>
                    <td>{`${u.nombre} ${u.apellido || ''}`.trim()}</td>
                    <td>{u.username}</td>
                    <td>{u.departamento_nombre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </section>
  );
}
