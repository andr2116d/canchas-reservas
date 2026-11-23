import { useId } from "react";

/**
 * Balón con volumen: la luz queda fija arriba a la izquierda y los gajos van por
 * dentro, para poder girarlos sin mover el brillo. Se dibuja centrado en el
 * origen con radio 12, dentro de un `<svg>` o un `<g>`.
 */
export function DibujoDelBalon({ claseDeLosGajos }: { claseDeLosGajos?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const luz = `luz-del-balon-${id}`;
  const forma = `forma-del-balon-${id}`;

  return (
    <>
      <defs>
        <radialGradient id={luz} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f4f6ef" />
          <stop offset="100%" stopColor="#c9d2c4" />
        </radialGradient>
        <clipPath id={forma}>
          <circle r="12" />
        </clipPath>
      </defs>
      <circle r="12" fill={`url(#${luz})`} />
      <g clipPath={`url(#${forma})`}>
        <g className={claseDeLosGajos} style={{ fill: "var(--color-tinta)" }}>
          <path d="M0-4.6 4.4-1.4 2.7 3.7H-2.7L-4.4-1.4Z" />
          <path d="M0-12.6 3-9.9 2.2-6.8H-2.2L-3-9.9Z" />
          <path d="M12-3.9 12.6 0 9.6 2.1 7.3 0 8.9-3.3Z" />
          <path d="M7.4 10.2 4.4 12.2 2.5 9 4.3 6.7 7.6 7.4Z" />
          <path d="M-7.4 10.2-7.6 7.4-4.3 6.7-2.5 9-4.4 12.2Z" />
          <path d="M-12-3.9-8.9-3.3-7.3 0-9.6 2.1-12.6 0Z" />
        </g>
      </g>
      <circle r="12" fill="none" stroke="rgb(19 38 30 / 0.35)" strokeWidth="0.8" />
      <ellipse cx="-4.5" cy="-5.5" rx="3.4" ry="2.1" fill="rgb(255 255 255 / 0.85)" />
    </>
  );
}
