"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { NOMBRE_DEL_DIA, type VistaDeHorario } from "@/compartido/horario/horario";
import type { DatosDeTarifa } from "../esquemas/tarifa.schema";
import { type ResumenDelDia, resumenDelDia } from "../utilidades/resumen-del-dia";

const turnosEnTexto = (cantidad: number) => (cantidad === 1 ? "1 turno" : `${cantidad} turnos`);

function textoDelDia(resumen: ResumenDelDia | undefined): string {
  if (!resumen) return "Cerrado";
  const { turnos, corto, sinTurno } = resumen;
  if (corto) return `${turnosEnTexto(turnos)} + 1 corto de ${corto.desde} a ${corto.hasta}`;
  if (sinTurno) return `${turnosEnTexto(turnos)} · sin turno de ${sinTurno.desde} a ${sinTurno.hasta}`;
  return turnosEnTexto(turnos);
}

/** Turnos que salen cada día con la duración y la opción del turno corto que se están editando. */
export function ResumenSemanal({ horario, idTitulo }: { horario?: VistaDeHorario; idTitulo: string }) {
  const { control } = useFormContext<DatosDeTarifa>();
  const [duracion, ofreceTurnoCorto] = useWatch({ control, name: ["duracionDelTurno", "ofreceTurnoCorto"] });
  const horas = Number(duracion);

  if (!horario) return <p className="text-sm text-grava">Guarda el horario de atención para ver los turnos de cada día.</p>;
  if (!Number.isInteger(horas) || horas < 1 || horas > 12) {
    return <p className="text-sm text-grava">Elige la duración del turno para ver los turnos de cada día.</p>;
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-tiza px-4 py-3">
      <h3 id={idTitulo} className="text-sm font-semibold text-tinta">Turnos de cada día</h3>
      <ul aria-labelledby={idTitulo} className="flex flex-col gap-1 text-sm">
        {horario.dias.map((dia) => {
          const resumen = resumenDelDia(dia, horas * 60, ofreceTurnoCorto);
          return (
            <li key={dia.dia} className="flex justify-between gap-3">
              <span className="font-semibold text-tinta">{NOMBRE_DEL_DIA[dia.dia]}</span>
              <span className={`text-right tabular-nums ${resumen?.sinTurno ? "text-alerta" : "text-grava"}`}>{textoDelDia(resumen)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
