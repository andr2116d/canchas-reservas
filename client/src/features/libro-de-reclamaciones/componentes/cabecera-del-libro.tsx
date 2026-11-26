import type { ReactNode } from "react";

/** Imagen del libro abierto que identifica al Libro de Reclamaciones. */
export function IconoDelLibro({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 34" aria-hidden="true" focusable="false" className={className}>
      <path d="M24 6C18 2 9 2 3 4v26c6-2 15-2 21 2 6-4 15-4 21-2V4c-6-2-15-2-21 2z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 6v26" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

/** Encabezado sobre la cancha oscura de las páginas del libro, como el de las páginas legales. */
export function CabeceraDelLibro({ titulo, resumen, children }: { titulo: string; resumen: string; children?: ReactNode }) {
  return (
    <header className="bg-cancha bg-[repeating-linear-gradient(90deg,var(--color-cancha)_0_7rem,var(--color-cancha-clara)_7rem_14rem)] print:hidden">
      <div className="envoltura-del-sitio flex flex-col gap-4 pt-32 pb-10">
        <p className="flex items-center gap-2 text-sm font-extrabold tracking-[0.12em] text-capitan uppercase">
          <IconoDelLibro className="h-5 w-auto" />
          Libro de Reclamaciones
        </p>
        <h1 className="font-titular text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.9] font-black text-balance text-papel">{titulo}</h1>
        <p className="max-w-2xl text-lg text-tiza/85">{resumen}</p>
        {children}
      </div>
    </header>
  );
}
