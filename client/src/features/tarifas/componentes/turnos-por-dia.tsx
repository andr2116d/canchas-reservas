"use client";

import { useBorrador } from "@/compartido/horario/borrador";
import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA } from "@/compartido/horario/horario";
import { calcularTurnos } from "@/compartido/horario/turnos";

/** Cuántos turnos salen cada día con el horario y la tarifa que se están editando. */
export function TurnosPorDia({ tipo }: { tipo: string }) {
  const { semana, tarifas } = useBorrador();
  const tarifa = tarifas[tipo];
  if (!semana) return <p className="text-sm text-grava">Guarda el horario para contar los turnos de cada día.</p>;
  if (!tarifa) return <p className="text-sm text-grava">Completa la tarifa para contar los turnos de cada día.</p>;

  return (
    <div className="flex flex-col gap-1.5">
      <p id={`${tipo}-turnos-por-dia`} className="text-sm font-bold text-tinta">Turnos por día</p>
      <ul aria-labelledby={`${tipo}-turnos-por-dia`} className="flex flex-wrap gap-1">
        {DIAS_DE_LA_SEMANA.map((dia) => {
          const horario = semana[dia];
          const nombre = NOMBRE_DEL_DIA[dia];
          if (!horario) {
            return (
              <li key={dia} aria-label={`${nombre}: cerrado`} className="w-10 rounded-lg border border-dashed border-linea py-1 text-center text-[0.7rem] text-grava">
                {nombre.slice(0, 3)}<b className="block text-sm">—</b>
              </li>
            );
          }
          const { turnos, sinTurno } = calcularTurnos(horario, tarifa);
          const detalle = sinTurno ? `; de ${sinTurno.desde} a ${sinTurno.hasta} sin turno` : "";
          return (
            <li key={dia} aria-label={`${nombre}: ${turnos.length} ${turnos.length === 1 ? "turno" : "turnos"}${detalle}`} title={detalle.slice(2) || undefined} className="w-10 rounded-lg bg-tiza py-1 text-center text-[0.7rem] text-grava tabular-nums">
              {nombre.slice(0, 3)}<b className={`block text-sm ${sinTurno ? "text-alerta" : "text-tinta"}`}>{turnos.length}</b>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
