import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

interface PlantaDeCanchaProps {
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
  juntoALaPared?: boolean;
  /** Dibuja las líneas como si se trazaran con tiza, para una cancha recién creada. */
  trazar?: boolean;
  className?: string;
}

const ALTO = 108;
const FRANJAS = 8;

function Reflectores({ x, ancho }: { x: number; ancho: number }) {
  const puntos = [[x - 6, 10], [x + ancho + 6, 10], [x - 6, ALTO - 10], [x + ancho + 6, ALTO - 10]];
  return puntos.map(([cx, cy]) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r="9" fill="rgb(220 235 123 / 0.35)" />
      <circle cx={cx} cy={cy} r="3.5" fill="var(--color-capitan)" />
    </g>
  ));
}

/** La cancha vista desde arriba: la de fútbol 7 más larga, reflectores si tiene luz y la pared si va junto a una. */
export function PlantaDeCancha({ tipo, tieneIluminacion, juntoALaPared, trazar, className = "" }: PlantaDeCanchaProps) {
  const ancho = tipo === "FUTBOL_7" ? 220 : 180;
  const x = (260 - ancho) / 2;
  const area = tipo === "FUTBOL_7" ? 30 : 24;
  return (
    <svg viewBox={`0 0 260 ${ALTO}`} aria-hidden="true" focusable="false" className={`planta-de-cancha ${className}`}>
      <rect width="260" height={ALTO} fill="#2a6f4a" />
      <rect x={x} y="14" width={ancho} height="80" fill="#2f7a52" />
      {Array.from({ length: FRANJAS }, (_, i) => (
        <rect key={i} x={x + (i * ancho) / FRANJAS} y="14" width={ancho / (FRANJAS * 2)} height="80" fill="#2a6f4a" />
      ))}
      {juntoALaPared && <rect x={x - 4} y="6" width={ancho + 8} height="5" rx="1" fill="#8e7a64" />}
      <g fill="none" stroke="rgb(255 255 255 / 0.85)" strokeWidth="1.6" className={trazar ? "planta-de-cancha__tiza" : undefined}>
        <rect x={x} y="14" width={ancho} height="80" />
        <line x1="130" y1="14" x2="130" y2="94" />
        <circle cx="130" cy="54" r="11" />
        <rect x={x} y={54 - area / 1.2} width={area} height={area * 1.66} />
        <rect x={x + ancho - area} y={54 - area / 1.2} width={area} height={area * 1.66} />
      </g>
      {tieneIluminacion && <Reflectores x={x} ancho={ancho} />}
    </svg>
  );
}
