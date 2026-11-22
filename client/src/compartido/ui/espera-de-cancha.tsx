/**
 * Pantalla de carga de todo el sitio: cubre la pantalla con la cancha y, al
 * centro, un jugador hace dominadas (pie, muslo, pecho y cabeza) hasta que el
 * balón cae y vuelve a empezar. No muestra texto; solo avisa «Cargando» a
 * lectores de pantalla.
 */
export function EsperaDeCancha() {
  return (
    <div role="status" className="espera-de-cancha">
      <span className="sr-only">Cargando</span>
      <svg aria-hidden="true" className="espera-de-cancha__jugada" viewBox="0 0 240 260" focusable="false">
        <ellipse className="espera-de-cancha__sombra-jugador" cx="104" cy="247" rx="30" ry="4" />
        <ellipse className="espera-de-cancha__sombra-balon" cx="0" cy="247" rx="10" ry="3" />

        {/* Pierna de apoyo, detrás. */}
        <g className="espera-de-cancha__pierna-apoyo">
          <line className="espera-de-cancha__piel" x1="96" y1="152" x2="94" y2="232" strokeWidth="11" />
          <path className="espera-de-cancha__botin" d="M86 230h18q9 0 11 9v4H86z" />
        </g>

        {/* Torso, brazos y cabeza: se inclinan desde la cadera. */}
        <g className="espera-de-cancha__torso">
          <line className="espera-de-cancha__piel" x1="96" y1="80" x2="86" y2="126" strokeWidth="8" />
          <path className="espera-de-cancha__camiseta" d="M87 74q15-9 30 0l-2 70H89z" />
          <path className="espera-de-cancha__franja" d="M101 70h4l-1 74h-4z" />
          <g className="espera-de-cancha__brazo">
            <line className="espera-de-cancha__piel" x1="112" y1="80" x2="132" y2="110" strokeWidth="8" />
          </g>
          <g className="espera-de-cancha__cabeza">
            <rect className="espera-de-cancha__piel-relleno" x="99" y="60" width="10" height="12" rx="3" />
            <circle className="espera-de-cancha__piel-relleno" cx="104" cy="52" r="14" />
            <path className="espera-de-cancha__pelo" d="M90 50a14 14 0 0 1 28 0q-6-6-14-6t-14 6z" />
          </g>
        </g>

        <rect className="espera-de-cancha__short" x="88" y="138" width="28" height="20" rx="4" />

        {/* Pierna que toca el balón: el muslo gira en la cadera y la pantorrilla en la rodilla. */}
        <g className="espera-de-cancha__muslo">
          <line className="espera-de-cancha__piel" x1="102" y1="152" x2="102" y2="192" strokeWidth="12" />
          <g className="espera-de-cancha__pantorrilla">
            <line className="espera-de-cancha__piel" x1="102" y1="192" x2="102" y2="232" strokeWidth="10" />
            <path className="espera-de-cancha__botin" d="M94 230h18q9 0 11 9v4H94z" />
          </g>
        </g>

        <g className="espera-de-cancha__balon">
          <g className="espera-de-cancha__giro">
            <circle className="espera-de-cancha__cuero" r="11" />
            <path className="espera-de-cancha__gajo" d="M0-5 5-1.5 3 4.5h-6L-5-1.5z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
