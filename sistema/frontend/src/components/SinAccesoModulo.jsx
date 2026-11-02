// Panel que se muestra cuando el usuario abre un módulo sin el permiso
// requerido. Aparece dentro del layout (main), con el estilo del sistema.
export default function SinAccesoModulo({ modulo }) {
  return (
    <section className="modulo-construccion">
      <div className="tarjeta modulo-construccion-tarjeta sin-acceso-tarjeta">
        <span className="sin-acceso-icono" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M5.6 5.6 18.4 18.4" />
          </svg>
        </span>
        <h2>No tiene permiso para {modulo || 'este módulo'}</h2>
        <p>
          Su cuenta no tiene asignado el rol necesario para ingresar aquí. Un
          administrador puede asignárselo desde el módulo de Usuarios.
        </p>
        <span className="chip chip-proximo">Acceso restringido</span>
      </div>
    </section>
  );
}
