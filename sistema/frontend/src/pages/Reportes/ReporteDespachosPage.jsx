import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNotificacion } from '../../components/Toast';

export default function ReporteDespachosPage() {
  const notificar = useNotificacion();
  const [data, setData] = useState({ total: 0, entregados: 0, parciales: 0, fallidos: 0, cancelados: 0, promedioHoras: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/despachos').then(r => {
      const d = r.data || [];
      const entregados = d.filter(x => x.estado === 'entregado').length;
      const parciales = d.filter(x => x.estado === 'entrega_parcial').length;
      const fallidos = d.filter(x => x.estado === 'fallido').length;
      const cancelados = d.filter(x => x.estado === 'cancelado').length;
      setData({ total: d.length, entregados, parciales, fallidos, cancelados, promedioHoras: 0 });
    }).catch(() => notificar.error('Error')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="pagina reporte-page">
      <div className="pagina-cabecera"><h1>Reporte de Despachos</h1></div>
      <div className="tarjetas" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="tarjeta tarjeta-valor" style={{ flex: '1 1 160px', textAlign: 'center' }}><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primario)' }}>{data.total}</div><div style={{ fontSize: 13, color: 'var(--color-texto-suave)' }}>Total</div></div>
        <div className="tarjeta tarjeta-valor" style={{ flex: '1 1 160px', textAlign: 'center', background: 'var(--color-primario-suave)' }}><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primario)' }}>{data.entregados}</div><div style={{ fontSize: 13, color: 'var(--color-texto-suave)' }}>Entregados</div></div>
        <div className="tarjeta tarjeta-valor" style={{ flex: '1 1 160px', textAlign: 'center', background: 'var(--color-aviso-fondo)' }}><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-aviso)' }}>{data.parciales}</div><div style={{ fontSize: 13, color: 'var(--color-texto-suave)' }}>Parciales</div></div>
        <div className="tarjeta tarjeta-valor" style={{ flex: '1 1 160px', textAlign: 'center', background: 'var(--color-peligro-fondo)' }}><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-peligro)' }}>{data.fallidos}</div><div style={{ fontSize: 13, color: 'var(--color-texto-suave)' }}>Fallidos</div></div>
      </div>
      <div className="tarjeta tarjeta-sombra"><h3>Detalle</h3><p>Exportación y gráficos disponibles tras configurar endpoint de reportes agregados (`/api/reportes-despachos`).</p></div>
    </div>
  );
}
