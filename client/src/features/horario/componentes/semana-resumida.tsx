"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";
import { semanaDelFormulario } from "../utilidades/datos-del-horario";

/** Cómo queda cada día con lo que se está editando: horario, horario propio o cerrado. */
export function SemanaResumida() {
  const { control } = useFormContext<DatosDelFormularioDeHorario>();
  const valores = useWatch({ control }) as DatosDelFormularioDeHorario;
  const semana = semanaDelFormulario(valores);
  const distinto = (dia: string) => valores.distintos.some((otro) => otro.dia === dia);

  return (
    <div className="flex flex-col gap-2.5">
      <p id="asi-queda" className="text-sm font-bold text-tinta">Así queda la semana</p>
      <ul aria-labelledby="asi-queda" className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
        {DIAS_DE_LA_SEMANA.map((dia) => {
          const horario = semana[dia];
          const estilo = !horario ? "border border-dashed border-linea text-grava" : distinto(dia) ? "bg-capitan/45" : "bg-tiza";
          return (
            <li key={dia} className={`rounded-xl px-2.5 py-1.5 text-xs leading-snug tabular-nums sm:w-[4.75rem] ${estilo}`}>
              <b className="block text-[0.8rem] text-tinta">{NOMBRE_DEL_DIA[dia].slice(0, 3)}</b>
              {horario ? `${horario.abre} – ${horario.cierra}` : "Cerrado"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
