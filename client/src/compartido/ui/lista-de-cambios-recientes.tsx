import type { ReactNode } from "react";
import { fechaEnLima } from "./fecha-en-lima";

/** Historial plegado de una pantalla: cuándo y, en una frase, quién hizo qué. */
export function ListaDeCambiosRecientes({ cambios }: { cambios: { ocurridoEn: string; frase: ReactNode }[] }) {
  if (cambios.length === 0) return null;
  return (
    <details className="rounded-2xl border border-white/80 bg-papel px-5 py-1 text-sm shadow-sm">
      <summary className="cursor-pointer py-3 font-bold text-tinta">Cambios recientes</summary>
      <ol className="mb-4 flex flex-col gap-2">
        {cambios.map((cambio, indice) => (
          <li key={`${cambio.ocurridoEn}-${indice}`} className="flex flex-wrap gap-x-3">
            <time dateTime={cambio.ocurridoEn} className="min-w-40 text-grava tabular-nums">{fechaEnLima(cambio.ocurridoEn)}</time>
            <span className="min-w-0 flex-1">{cambio.frase}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
