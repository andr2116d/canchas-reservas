"use client";

import { useBorrador } from "@/compartido/horario/borrador";
import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";

const CASILLA = "w-10 rounded-lg py-1 text-center text-[0.7rem] text-grava tabular-nums";

/** Cuántos turnos salen cada día con el horario y la tarifa en edición, según el server. */
export function TurnosPorDia({ tipo }: { tipo: string }) {
  const { simulacion, tiposConTarifa } = useBorrador();
  if (!tiposConTarifa.includes(tipo)) return <p className="text-sm text-grava">Completa la tarifa para contar los turnos de cada día.</p>;
  const semana = simulacion?.tipos[tipo];
  if (!semana) return <p className="text-sm text-grava">Contando los turnos de cada día…</p>;

  return (
    <div className="flex flex-col gap-1.5">
      <p id={`${tipo}-turnos-por-dia`} className="text-sm font-bold text-tinta">Turnos por día</p>
      <ul aria-labelledby={`${tipo}-turnos-por-dia`} className="flex flex-wrap gap-1">
        {DIAS_DE_LA_SEMANA.map((dia) => {
          const delDia = semana[dia];
          const nombre = NOMBRE_DEL_DIA[dia];
          if (delDia.estado === "CERRADO") {
            return (
              <li key={dia} aria-label={`${nombre}: cerrado`} className={`${CASILLA} border border-dashed border-linea`}>
                {nombre.slice(0, 3)}<b className="block text-sm">—</b>
              </li>
            );
          }
          const { turnos, sinTurno } = delDia;
          const detalle = sinTurno ? `; de ${sinTurno.desde} a ${sinTurno.hasta} sin turno` : "";
          return (
            <li key={dia} aria-label={`${nombre}: ${turnos.length} ${turnos.length === 1 ? "turno" : "turnos"}${detalle}`} title={detalle.slice(2) || undefined} className={`${CASILLA} bg-tiza`}>
              {nombre.slice(0, 3)}<b className={`block text-sm ${sinTurno ? "text-alerta" : "text-tinta"}`}>{turnos.length}</b>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
