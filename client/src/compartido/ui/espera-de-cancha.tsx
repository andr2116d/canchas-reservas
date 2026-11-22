/** Indicador de espera con un balón y dos botines. */
export function EsperaDeCancha({ mensaje = "Cargando tu cuenta…" }: { mensaje?: string }) {
  return (
    <div role="status" className="espera-de-cancha">
      <span className="sr-only">{mensaje}</span>
      <div aria-hidden="true" className="espera-de-cancha__campo">
        <span className="espera-de-cancha__sombra" />
        <span className="espera-de-cancha__pie espera-de-cancha__pie--izquierdo">
          <span />
        </span>
        <span className="espera-de-cancha__pie espera-de-cancha__pie--derecho">
          <span />
        </span>
        <span className="espera-de-cancha__balon">
          <span />
        </span>
      </div>
    </div>
  );
}
