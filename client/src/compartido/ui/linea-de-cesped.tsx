import { useId } from "react";

const ANCHO = 220;
const BASE = 22;

// Con dos decimales, el server y el navegador escriben el mismo trazo aunque difieran en el último dígito.
const n = (valor: number) => Math.round(valor * 100) / 100;

/** Hojas de pasto a lo largo de la línea: más altas al centro, inclinadas y sin repetir el patrón. */
export const HOJAS = Array.from({ length: 44 }, (_, indice) => {
  const x = 4 + indice * 4.9;
  const centro = Math.sin((Math.PI * indice) / 43);
  const alto = 3 + 7 * centro + ((indice * 7) % 5) * 0.8;
  const inclinacion = ((indice * 5) % 7) - 3;
  return `M${n(x)} ${BASE}Q${n(x + 0.8)} ${n(BASE - alto / 2)} ${n(x + 1.6 + inclinacion)} ${n(BASE - alto)}Q${n(x + 2)} ${n(BASE - alto / 2)} ${n(x + 3.2)} ${BASE}Z`;
}).join("");

/** Franja de césped donde pica la pelota; se desvanece en los extremos para no parecer una caja. */
export function LineaDeCesped() {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const desvanecido = `cesped-desvanecido-${id}`;
  const degradado = `cesped-degradado-${id}`;
  return (
    <svg aria-hidden="true" focusable="false" className="linea-de-cesped" viewBox={`0 0 ${ANCHO} ${BASE + 6}`}>
      <defs>
        <linearGradient id={degradado}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#fff" />
          <stop offset="0.78" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={desvanecido}>
          <rect width={ANCHO} height={BASE + 6} fill={`url(#${degradado})`} />
        </mask>
      </defs>
      <g mask={`url(#${desvanecido})`}>
        <path className="linea-de-cesped__hojas" d={HOJAS} />
        <rect className="linea-de-cesped__piso" x="0" y={BASE - 1} width={ANCHO} height="3" rx="1.5" />
      </g>
    </svg>
  );
}
