"use client";

import { Controller, useFormContext } from "react-hook-form";
import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";

const ATAJOS: { texto: string; dias: DiaDeLaSemana[] }[] = [
  { texto: "Todos los días", dias: [...DIAS_DE_LA_SEMANA] },
  { texto: "Lunes a sábado", dias: DIAS_DE_LA_SEMANA.slice(0, 6) },
  { texto: "Lunes a viernes", dias: DIAS_DE_LA_SEMANA.slice(0, 5) },
];

export const ENLACE =
  "text-sm font-bold text-botella underline decoration-botella/30 underline-offset-4 hover:decoration-botella " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella";

export const CHIP =
  "rounded-full border border-linea bg-papel px-3.5 py-1.5 text-sm font-bold text-grava transition-colors " +
  "hover:border-botella/40 aria-pressed:border-botella aria-pressed:bg-botella aria-pressed:text-papel " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella";

/** Días de la semana en que abre el local, con atajos para elegir varios de una vez. */
export function DiasQueAbre() {
  const { control } = useFormContext<DatosDelFormularioDeHorario>();
  return (
    <Controller
      control={control}
      name="abiertos"
      render={({ field }) => {
        const alternar = (dia: DiaDeLaSemana) =>
          field.onChange(field.value.includes(dia) ? field.value.filter((abierto) => abierto !== dia) : DIAS_DE_LA_SEMANA.filter((otro) => otro === dia || field.value.includes(otro)));
        return (
          <div className="flex flex-col gap-2.5">
            <p id="dias-que-abre" className="text-sm font-bold text-tinta">Días que abre</p>
            <div role="group" aria-labelledby="dias-que-abre" className="flex flex-wrap gap-1.5">
              {DIAS_DE_LA_SEMANA.map((dia) => (
                <button key={dia} type="button" aria-pressed={field.value.includes(dia)} aria-label={`Abre el ${NOMBRE_DEL_DIA[dia].toLowerCase()}`} onClick={() => alternar(dia)} className={CHIP}>
                  {NOMBRE_DEL_DIA[dia].slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ATAJOS.map((atajo) => (
                <button key={atajo.texto} type="button" onClick={() => field.onChange(atajo.dias)} className={ENLACE}>{atajo.texto}</button>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}
