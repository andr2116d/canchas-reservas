/**
 * Pantalla de carga de todo el sitio: cubre la pantalla con la cancha y, al
 * centro, un balón haciendo dominadas entre dos botines. No muestra texto; solo
 * avisa «Cargando» a lectores de pantalla.
 */
export function EsperaDeCancha() {
  return (
    <div role="status" className="espera-de-cancha">
      <span className="sr-only">Cargando</span>
      <div aria-hidden="true" className="espera-de-cancha__jugada">
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
