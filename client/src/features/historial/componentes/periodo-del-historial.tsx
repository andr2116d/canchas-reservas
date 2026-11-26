"use client";

import { PERIODOS, periodoDe, rangoDelPeriodo } from "../utilidades/filtros";
import { useConsultaDelHistorial } from "./consulta-del-historial";

/** Atajos de fechas sobre la cancha del encabezado: todo, hoy, ayer, 7 o 30 días. */
export function PeriodoDelHistorial() {
  const { filtros, hoy, aplicar } = useConsultaDelHistorial();
  const actual = periodoDe(filtros, hoy);
  return (
    <div role="group" aria-label="Período" className="vidrio-verde flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-2xl p-1">
      {PERIODOS.map(({ valor, texto }) => (
        <button
          key={valor}
          type="button"
          aria-pressed={actual === valor}
          onClick={() => aplicar(rangoDelPeriodo(valor, hoy))}
          className="rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap text-tiza/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-capitan aria-pressed:bg-papel aria-pressed:text-tinta"
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
