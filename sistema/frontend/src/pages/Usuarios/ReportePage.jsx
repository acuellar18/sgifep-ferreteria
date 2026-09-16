import { useEffect, useState } from 'react';
import api from '../../services/api';
import exportarCSV from '../../utils/csv';

export default function ReportePage() {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api
      .get('/usuarios/reporte')
      .then((res) => {
        if (activo) setReporte(res.data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) return <p className="estado">Cargando reporte...</p>;
  if (error) return <div className="alerta alerta-error">{error}</div>;
  if (!reporte) return null;

  const { totales, porDepartamento, porRol } = reporte;

  // Exporta ambos bloques del reporte a un único CSV con cabeceras comunes.
  function exportarCsv() {
    const filas = [
      {
        Seccion: 'TOTALES',
        Nombre: 'General',
        Detalle: `${totales.total} usuarios (${totales.activos} activos, ${totales.inactivos} inactivos)`,
        Activos: Number(totales.activos)
      },
      ...porDepartamento.map((d) => ({
        Seccion: 'POR DEPARTAMENTO',
        Nombre: d.nombre,
        Detalle: '',
        Activos: Number(d.total_activos)
      })),
      ...porRol.map((r) => ({
        Seccion: 'POR ROL',
        Nombre: r.nombre,
        Detalle: r.acceso_total ? 'Acceso total' : '',
        Activos: Number(r.total_activos)
      }))
    ];
    exportarCSV(filas, `reporte_usuarios_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <section className="reporte-imprimible">
      <div className="encabezado-pagina">
        <h2>Reporte de usuarios</h2>
        <div className="acciones-encabezado">
          <button type="button" className="btn btn-secundario" onClick={() => window.print()}>
            Imprimir
          </button>
          <button type="button" className="btn btn-primario" onClick={exportarCsv}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="tarjetas">
        <div className="tarjeta">
          <span className="tarjeta-valor">{totales.total}</span>
          <span className="tarjeta-etiqueta">Total de usuarios</span>
        </div>
        <div className="tarjeta tarjeta-ok">
          <span className="tarjeta-valor">{totales.activos}</span>
          <span className="tarjeta-etiqueta">Activos</span>
        </div>
        <div className="tarjeta tarjeta-peligro">
          <span className="tarjeta-valor">{totales.inactivos}</span>
          <span className="tarjeta-etiqueta">Inactivos</span>
        </div>
      </div>

      <div className="reporte-grid">
        <div>
          <h3>Usuarios activos por departamento</h3>
          {porDepartamento.length === 0 ? (
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
                  {porDepartamento.map((d) => (
                    <tr key={d.id}>
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
          {porRol.length === 0 ? (
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
                  {porRol.map((r) => (
                    <tr key={r.id}>
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
    </section>
  );
}