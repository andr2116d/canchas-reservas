import type { SVGProps } from "react";

/** Monograma LP del club: las iniciales con un trazo inclinado hacia el ataque. */
export function MonogramaLaPrevia(propiedades: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 58 52" role="img" aria-label="La Previa" {...propiedades}>
      <rect width="58" height="52" rx="12" fill="var(--color-cancha)" />
      <path
        transform="translate(7 6)"
        fill="var(--color-capitan)"
        fillRule="evenodd"
        d="M3 5h12l-5 20h11l-2 8H0L7 5zm17 0h14c8 0 12 4 10 11-2 7-7 11-15 11h-4l-2 6h-9l5-19h9l-2 6h4c3 0 5-1 5-4 1-2-1-3-3-3H18z"
      />
    </svg>
  );
}
