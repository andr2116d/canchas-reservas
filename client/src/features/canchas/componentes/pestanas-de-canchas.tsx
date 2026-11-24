"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { ruta: "/administracion/canchas", texto: "Canchas" },
  { ruta: "/administracion/canchas/mantenimiento", texto: "Mantenimiento" },
];

/** Pestañas de vidrio sobre la cancha; Mantenimiento cuenta los bloqueos en curso. */
export function PestanasDeCanchas({ enCurso = 0 }: { enCurso?: number }) {
  const rutaActual = usePathname();
  return (
    <nav aria-label="Secciones de canchas" className="vidrio-verde flex w-fit max-w-full gap-0.5 rounded-2xl p-1">
      {PESTANAS.map(({ ruta, texto }) => (
        <Link
          key={ruta}
          href={ruta}
          aria-current={rutaActual === ruta ? "page" : undefined}
          className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap text-tiza/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-capitan aria-[current=page]:bg-papel aria-[current=page]:text-tinta"
        >
          {texto}
          {texto === "Mantenimiento" && enCurso > 0 && (
            <span className="rounded-full bg-[#c98a1b] px-1.5 text-xs text-papel tabular-nums" aria-label={`${enCurso} en curso`}>{enCurso}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
