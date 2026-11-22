import { useId } from "react";

/** Hojas de pasto alrededor de los pies: curvas, inclinadas y más altas al centro. */
const PASTO = Array.from({ length: 30 }, (_, indice) => {
  const x = 36 + indice * 6;
  const alto = 4 + 6 * Math.sin((Math.PI * indice) / 29) + ((indice * 7) % 4);
  const inclinacion = ((indice * 5) % 7) - 3;
  const punta = x + 2 + inclinacion;
  return `M${x} 205Q${x + 1} ${205 - alto / 2} ${punta} ${205 - alto}Q${x + 2.5} ${205 - alto / 2} ${x + 4} 205Z`;
}).join("");

/** Botín visto de perfil, apuntando a la derecha, con el tobillo en el origen. */
function Botin() {
  return (
    <g className="espera-de-cancha__botin">
      <path
        className="espera-de-cancha__botin-cuerpo"
        d="M-11-7C-4-12 5-12 11-7L23 3C35 7 47 9 55 13 62 17 62 24 55 26L-12 26C-17 26-17 18-15 11Z"
      />
      <path className="espera-de-cancha__botin-talon" d="M-11-7C-14 0-16 8-15 11-17 18-17 26-12 26L-2 26C-5 18-6 6-4-9Z" />
      <path className="espera-de-cancha__botin-franja" d="M4 6C16 10 30 15 44 22L40 24C28 18 15 13 2 10Z" />
      <path className="espera-de-cancha__cordones" d="M9-3 13 0M14 0.5 18 3.5M19 4 23 7" />
      <path className="espera-de-cancha__suela" d="M-13 24H56Q60 24 58 27L57 28H-12Q-15 28-13 24Z" />
      <g className="espera-de-cancha__tapones">
        <rect x="-9" y="27" width="5" height="4" rx="1.5" />
        <rect x="4" y="27" width="5" height="4" rx="1.5" />
        <rect x="24" y="27" width="5" height="4" rx="1.5" />
        <rect x="42" y="27" width="5" height="4" rx="1.5" />
      </g>
    </g>
  );
}

/** Pierna con media del club y botín. El tobillo queda en el origen y la cadera, arriba del cuadro. */
function Pierna({ plano }: { plano: "atras" | "adelante" }) {
  const x = plano === "atras" ? 57 : 137;
  return (
    <g transform={`translate(${x} 170)`}>
      <g className={`espera-de-cancha__pierna espera-de-cancha__pierna--${plano}`}>
        <rect className="espera-de-cancha__piel" x="-12" y="-240" width="24" height="136" rx="10" />
        <rect className="espera-de-cancha__media" x="-11" y="-112" width="22" height="110" rx="5" />
        <rect className="espera-de-cancha__media-doblez" x="-12.5" y="-116" width="25" height="12" rx="4" />
        <rect className="espera-de-cancha__media-franja" x="-11" y="-92" width="22" height="3.5" />
        <rect className="espera-de-cancha__media-franja" x="-11" y="-85" width="22" height="3.5" />
        <g className="espera-de-cancha__tobillo">
          <Botin />
        </g>
      </g>
    </g>
  );
}

/** Balón con luz fija: los gajos giran por dentro y el brillo se queda arriba a la izquierda. */
function Balon({ luz, forma }: { luz: string; forma: string }) {
  return (
    <g className="espera-de-cancha__balon">
      <g className="espera-de-cancha__deformacion">
        <circle r="12" fill={`url(#${luz})`} />
        <g clipPath={`url(#${forma})`}>
          <g className="espera-de-cancha__gajos">
            <path d="M0-4.6 4.4-1.4 2.7 3.7H-2.7L-4.4-1.4Z" />
            <path d="M0-12.6 3-9.9 2.2-6.8H-2.2L-3-9.9Z" />
            <path d="M12-3.9 12.6 0 9.6 2.1 7.3 0 8.9-3.3Z" />
            <path d="M7.4 10.2 4.4 12.2 2.5 9 4.3 6.7 7.6 7.4Z" />
            <path d="M-7.4 10.2-7.6 7.4-4.3 6.7-2.5 9-4.4 12.2Z" />
            <path d="M-12-3.9-8.9-3.3-7.3 0-9.6 2.1-12.6 0Z" />
          </g>
        </g>
        <circle className="espera-de-cancha__borde-balon" r="12" />
        <ellipse className="espera-de-cancha__brillo" cx="-4.5" cy="-5.5" rx="3.4" ry="2.1" />
      </g>
    </g>
  );
}

/**
 * Pantalla de carga de todo el sitio: cubre la pantalla con la cancha y, al
 * centro, un jugador de perfil hace dominadas alternando los pies. No muestra
 * texto; solo avisa «Cargando» a lectores de pantalla.
 */
export function EsperaDeCancha() {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const luz = `luz-del-balon-${id}`;
  const forma = `forma-del-balon-${id}`;
  const desvanecido = `desvanecido-${id}`;
  const degradado = `degradado-${id}`;

  return (
    <div role="status" className="espera-de-cancha">
      <span className="sr-only">Cargando</span>
      <svg aria-hidden="true" className="espera-de-cancha__jugada" viewBox="0 -30 240 250" focusable="false">
        <defs>
          <radialGradient id={luz} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f4f6ef" />
            <stop offset="100%" stopColor="#c9d2c4" />
          </radialGradient>
          <clipPath id={forma}>
            <circle r="12" />
          </clipPath>
          <linearGradient id={degradado} gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="22">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id={desvanecido} maskUnits="userSpaceOnUse" x="-40" y="-60" width="320" height="300">
            <rect x="-40" y="-60" width="320" height="300" fill={`url(#${degradado})`} />
          </mask>
        </defs>

        <ellipse className="espera-de-cancha__sombra-pies" cx="122" cy="204" rx="82" ry="5" />
        <ellipse className="espera-de-cancha__sombra-balon" cx="0" cy="204" rx="12" ry="3" />

        <g mask={`url(#${desvanecido})`}>
          <Pierna plano="atras" />
          <Pierna plano="adelante" />
        </g>

        <path className="espera-de-cancha__pasto" d={PASTO} />
        <Balon luz={luz} forma={forma} />
      </svg>
    </div>
  );
}
