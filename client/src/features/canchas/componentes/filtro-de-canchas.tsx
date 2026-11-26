"use client";

import type { Cancha } from "../servicios/canchas";

export type Filtro = "todas" | "FUTBOL_5" | "FUTBOL_7" | "desactivadas";

const OPCIONES: { valor: Filtro; texto: string }[] = [
  { valor: "todas", texto: "Todas" },
  { valor: "FUTBOL_5", texto: "Fútbol 5" },
  { valor: "FUTBOL_7", texto: "Fútbol 7" },
  { valor: "desactivadas", texto: "Desactivadas" },
];

export function cumpleElFiltro(cancha: Cancha, filtro: Filtro): boolean {
  if (filtro === "todas") return true;
  if (filtro === "desactivadas") return cancha.estado === "DESACTIVADA";
  return cancha.tipo === filtro;
}

/** Botones de vidrio para ver todas, por tamaño o solo las desactivadas, con cuántas hay en cada grupo. */
export function FiltroDeCanchas({ canchas, filtro, alElegir }: { canchas: Cancha[]; filtro: Filtro; alElegir: (filtro: Filtro) => void }) {
  return (
    <div role="group" aria-label="Mostrar" className="vidrio-claro flex w-fit max-w-full flex-wrap gap-0.5 rounded-2xl p-1">
      {OPCIONES.map(({ valor, texto }) => (
        <button
          key={valor}
          type="button"
          aria-pressed={filtro === valor}
          onClick={() => alElegir(valor)}
          className="rounded-xl px-3.5 py-2 text-sm font-bold text-grava transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-botella aria-pressed:bg-botella aria-pressed:text-papel"
        >
          {texto} <span className="font-semibold opacity-75 tabular-nums">{canchas.filter((c) => cumpleElFiltro(c, valor)).length}</span>
        </button>
      ))}
    </div>
  );
}
