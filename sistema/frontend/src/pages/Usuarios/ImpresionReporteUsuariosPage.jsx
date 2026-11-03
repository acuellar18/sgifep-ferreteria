import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../../services/api';
import PrintLayout from '../../components/print/PrintLayout';
import logoImg from '../../assets/logo.png';
import { formatearFecha, formatearFechaHora } from '../../utils/formatos';

const CLAVE_SESION = 'session';
const MM = 96 / 25.4; // conversión mm → px a 96dpi (idéntica en impresión)
const GAP_EXTRA = 40; // respiro extra en px (pie de página y gaps flex) para no cortar filas

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

function leerFiltrosUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    estado: params.get('estado') || 'todos',
    departamento: params.get('departamento') || '',
    rol: params.get('rol') || '',
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || ''
  };
}

function paramsDeFiltros(filtros) {
  const params = {};
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== 'todos' && valor !== null && valor !== undefined) {
      params[clave] = valor;
    }
  }
  return params;
}

function etiquetaActivo(activo) {
  return activo ? 'Activo' : 'Inactivo';
}

function nombreCompleto(u) {
  return `${u.nombre || ''} ${u.apellido || ''}`.trim() || '—';
}

function EncabezadoPortada({ usuario }) {
  return (
    <header className="print-rep-encabezado">
      <div className="print-rep-empresa">
        <img src={logoImg} alt="Ferretería El Puente" className="print-rep-logo" />
        <div>
          <h1>Ferretería El Puente</h1>
          <p>SGIFEP · Sistema de Gestión, Inventario y Facturación</p>
        </div>
      </div>
      <div className="print-rep-titulo-doc">
        <span className="print-rep-etiqueta">REPORTE</span>
        <strong>Reporte de usuarios</strong>
      </div>
    </header>
  );
}

function Continuacion() {
  return (
    <div className="print-rep-continuacion">
      <strong>Ferretería El Puente · SGIFEP</strong>
      <span>Reporte de usuarios</span>
    </div>
  );
}

function MetaBloque({ filtros, departamentos, roles }) {
  const partes = [];
  if (filtros.q) partes.push(`Búsqueda: "${filtros.q}"`);
  if (filtros.estado === 'activo') partes.push('Estado: Solamente activos');
  else if (filtros.estado === 'inactivo') partes.push('Estado: Solamente inactivos');
  const depto = departamentos.find((d) => String(d.id) === String(filtros.departamento));
  if (depto) partes.push(`Departamento: ${depto.nombre}`);
  const rol = roles.find((r) => String(r.id) === String(filtros.rol));
  if (rol) partes.push(`Rol: ${rol.nombre}`);
  if (filtros.startDate) partes.push(`Desde: ${formatearFecha(filtros.startDate)}`);
  if (filtros.endDate) partes.push(`Hasta: ${formatearFecha(filtros.endDate)}`);
  if (partes.length === 0) partes.push('Sin filtros aplicados');

  const sesion = leerSesion();
  return (
    <div className="print-rep-meta">
      <p>
        <span>Generado el</span> {formatearFechaHora(new Date())}
        <span> por</span> {sesion?.nombre || sesion?.username || '—'}
      </p>
      <p><span>Filtros aplicados:</span> {partes.join(' · ')}</p>
    </div>
  );
}

function Resumen({ totales }) {
  return (
    <div className="print-rep-resumen">
      <div><span>Total de usuarios</span><strong>{Number(totales.total) || 0}</strong></div>
      <div><span>Activos</span><strong>{Number(totales.activos) || 0}</strong></div>
      <div><span>Inactivos</span><strong>{Number(totales.inactivos) || 0}</strong></div>
    </div>
  );
}

function TablaDepartamento({ porDepartamento }) {
  return (
    <section className="print-rep-seccion">
      <h3>Usuarios activos por departamento</h3>
      <table className="print-tabla print-rep-tabla">
        <thead>
          <tr><th>Departamento</th><th className="num">Activos</th></tr>
        </thead>
        <tbody>
          {porDepartamento.map((d) => (
            <tr key={d.id}>
              <td>{d.nombre}</td>
              <td className="num">{Number(d.total_activos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TablaRol({ porRol }) {
  return (
    <section className="print-rep-seccion">
      <h3>Usuarios activos por rol</h3>
      <table className="print-tabla print-rep-tabla">
        <thead>
          <tr><th>Rol</th><th>Acceso total</th><th className="num">Activos</th></tr>
        </thead>
        <tbody>
          {porRol.map((r) => (
            <tr key={r.id}>
              <td>{r.nombre}</td>
              <td>{r.acceso_total ? 'Sí' : 'No'}</td>
              <td className="num">{Number(r.total_activos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TablaUsuarios({ usuarios }) {
  return (
    <table className="print-tabla print-rep-tabla-detalle">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre completo</th>
          <th>Departamento</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr key={u.id}>
            <td>{u.codigo || '—'}</td>
            <td>{nombreCompleto(u)}</td>
            <td>{u.departamento_nombre || '—'}</td>
            <td>{(u.roles || []).join(', ') || '—'}</td>
            <td>{etiquetaActivo(u.activo)}</td>
            <td>{formatearFecha(u.creado_en)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Vista de impresión profesional del Reporte de Usuarios.
// Abre sus propios datos (mismos filtros, pasados por query string) y arma
// hojas tamaño carta con cabecera de empresa, resúmenes, desgloses y el
// listado detallado paginado con "Página X de Y".
export default function ImpresionReporteUsuariosPage() {
  const filtros = useRef(leerFiltrosUrl()).current;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [paginas, setPaginas] = useState(null);

  // Refs de la "regla" de medición (mismas clases de impresión, fuera de vista).
  const refBloque0 = useRef(null); // portada: encabezado + meta + resumen + desgloses + título listado + thead
  const refBloqueN = useRef(null); // continuación: cabecera compacta + título listado + thead
  const refFila = useRef(null);
  const refTheadDetalle = useRef(null);
  const refPie = useRef(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      api.get('/usuarios/reporte', { params: paramsDeFiltros(filtros) }),
      api.get('/departamentos?estado=activo'),
      api.get('/roles?estado=activo')
    ])
      .then(([reporte, departamentos, roles]) => {
        if (activo) {
          setDatos({
            reporte: reporte.data,
            departamentos: departamentos.data,
            roles: roles.data
          });
        }
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!datos || !refBloque0.current) return;
    const { reporte } = datos;
    const usuarios = reporte.usuarios || [];

    // Altura útil de una hoja carta (279.4mm) menos el padding vertical (12mm×2),
    // en px. Las alturas medidas en pantalla coinciden con la impresión porque
    // las clases son las mismas y el ancho de impresión es ≥ al de medición
    // (resulta en un cálculo conservador, nunca corta filas).
    const altoPagina = (279.4 - 2 * 12) * MM;
    const altoPie = refPie.current.offsetHeight;
    const altoBloque0 = refBloque0.current.offsetHeight;
    const altoBloqueN = refBloqueN.current.offsetHeight;
    const altoFila = refFila.current.offsetHeight;
    const altoThead = refTheadDetalle.current.offsetHeight || 0;

    const filasPagina0 = Math.max(
      0,
      Math.floor((altoPagina - altoPie - altoBloque0 - GAP_EXTRA) / altoFila)
    );
    const filasPaginaN = Math.max(
      1,
      Math.floor((altoPagina - altoPie - altoBloqueN - altoThead - GAP_EXTRA) / altoFila)
    );

    const bloques = [];
    if (usuarios.length === 0) {
      bloques.push([]);
    } else {
      let restantes = usuarios.length;
      const corte0 = Math.min(filasPagina0, restantes);
      bloques.push(usuarios.slice(0, corte0));
      restantes -= corte0;
      let desde = corte0;
      while (restantes > 0) {
        const trozo = Math.min(filasPaginaN, restantes);
        bloques.push(usuarios.slice(desde, desde + trozo));
        desde += trozo;
        restantes -= trozo;
      }
    }

    setPaginas(
      bloques.map((usuariosDePagina, indice) => {
        const esPortada = indice === 0;
        return esPortada ? (
          <div className="print-rep-stack" key={indice}>
            <EncabezadoPortada />
            <MetaBloque filtros={filtros} departamentos={datos.departamentos} roles={datos.roles} />
            <Resumen totales={reporte.totales} />
            <TablaDepartamento porDepartamento={reporte.porDepartamento} />
            <TablaRol porRol={reporte.porRol} />
            {reporte.usuarios.length === 0 ? (
              <p className="print-vacio">
                No hay usuarios que cumplan los filtros aplicados.
              </p>
            ) : usuariosDePagina.length > 0 ? (
              <>
                <h3 className="print-rep-titulo-listado">Listado detallado de usuarios</h3>
                <TablaUsuarios usuarios={usuariosDePagina} />
              </>
            ) : null}
          </div>
        ) : (
          <div className="print-rep-stack" key={indice}>
            <Continuacion />
            <h3 className="print-rep-titulo-listado">Listado detallado de usuarios</h3>
            <TablaUsuarios usuarios={usuariosDePagina} />
          </div>
        );
      })
    );
  }, [datos, filtros]);

  if (error) return <div className="print-error">{error}</div>;

  return (
    <>
      {/* Regla de medición: fuera de la vista (no-print), misma tipografía.
          Debe montarse siempre para que useLayoutEffect pueda medir alturas y
          calcular la paginación; si se oculta con un return temprano los refs
          quedan nulos y la vista se queda en "Preparando...". */}
      {datos && (
        <div className="print-rep-regla no-print" aria-hidden="true">
          <div ref={refBloque0} className="print-rep-stack">
            <EncabezadoPortada />
            <MetaBloque filtros={filtros} departamentos={datos.departamentos} roles={datos.roles} />
            <Resumen totales={datos.reporte.totales} />
            <TablaDepartamento porDepartamento={datos.reporte.porDepartamento} />
            <TablaRol porRol={datos.reporte.porRol} />
            <h3 className="print-rep-titulo-listado">Listado detallado de usuarios</h3>
            <table className="print-tabla print-rep-tabla-detalle">
              <thead ref={refTheadDetalle}>
                <tr>
                  <th>Código</th>
                  <th>Nombre completo</th>
                  <th>Departamento</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
            </table>
          </div>
          <div ref={refBloqueN} className="print-rep-stack">
            <Continuacion />
            <h3 className="print-rep-titulo-listado">Listado detallado de usuarios</h3>
          </div>
          <table className="print-tabla print-rep-tabla-detalle">
            <tbody>
              <tr ref={refFila}>
                <td>COD-000</td>
                <td>Usuario Ejemplo Apellido</td>
                <td>Ventas</td>
                <td>caja, ventas</td>
                <td>Activo</td>
                <td>01/01/2026</td>
              </tr>
            </tbody>
          </table>
          <footer className="print-pie" ref={refPie}>
            <span>Reporte de usuarios</span>
            <span>Página 1 de 1</span>
          </footer>
        </div>
      )}

      {paginas ? (
        <PrintLayout
          titulo="Reporte de usuarios"
          subtitulo="Ferretería El Puente · SGIFEP"
          orientacion="portrait"
          tamano="letter"
          paginas={paginas}
          nombreArchivo="Reporte de usuarios"
        />
      ) : (
        <div className="print-error">Preparando reporte para imprimir...</div>
      )}
    </>
  );
}