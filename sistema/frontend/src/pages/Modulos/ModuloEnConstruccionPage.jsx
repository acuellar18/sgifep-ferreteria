import { RUTA_MODULOS_PRINCIPALES } from '../../config/navegacionSistema';

export default function ModuloEnConstruccionPage({ titulo, descripcion }) {
  return (
    <section className="modulo-construccion">
      <div className="tarjeta modulo-construccion-tarjeta">
        <span className="chip">Módulo en construcción</span>
        <h2>{titulo}</h2>
        <p>
          {descripcion ||
            'Este módulo todavía no está disponible. Estamos trabajando para integrarlo al sistema.'}
        </p>
        <a className="btn btn-primario" href={RUTA_MODULOS_PRINCIPALES}>
          Volver a Módulos Principales
        </a>
      </div>
    </section>
  );
}
