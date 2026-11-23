"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { DatosDeLaRegla } from "../esquemas/regla.schema";
import { colorDelPorcentaje } from "../utilidades/color-del-porcentaje";

/** La regla vista en el tiempo: de más anticipación al inicio del turno, con lo que devuelve cada tramo. */
export function LineaDeTiempo() {
  const { control } = useFormContext<DatosDeLaRegla>();
  const rangos = useWatch({ control, name: "rangos" })
    .filter((rango) => /^\d+$/.test(rango.desdeHoras.trim()) && /^\d+$/.test(rango.porcentaje.trim()))
    .map((rango) => ({ horas: Number(rango.desdeHoras), porcentaje: Number(rango.porcentaje) }))
    .sort((a, b) => b.horas - a.horas);
  if (rangos.length === 0) return null;

  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <ol aria-label="La regla en el tiempo" className="flex h-12 overflow-hidden rounded-xl">
        {rangos.map((rango, indice) => {
          const hasta = rangos[indice - 1]?.horas;
          const tramo = hasta === undefined ? `${rango.horas} h o más` : rango.horas === 0 ? `menos de ${hasta} h` : `de ${rango.horas} a ${hasta} h`;
          return (
            <li key={`${rango.horas}-${indice}`} className="flex min-w-0 flex-1 flex-col justify-center px-3 text-papel" style={{ background: colorDelPorcentaje(rango.porcentaje) }}>
              <b className="font-titular text-xl leading-none font-black tabular-nums">{rango.porcentaje} %</b>
              <span className="truncate text-[0.7rem] opacity-90">{tramo}</span>
            </li>
          );
        })}
      </ol>
      <figcaption className="flex justify-between text-xs text-grava">
        <span>Más anticipación</span>
        <span className="font-semibold text-tinta">Inicio del turno</span>
      </figcaption>
    </figure>
  );
}
