import type { DiaDeLaSemana, DiaDelClub } from "../servicios/club";

const ORDEN: DiaDeLaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const NOMBRE: Record<DiaDeLaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export interface TramoDelHorario {
  dias: string;
  horas: string;
}

const horasDe = (dia: DiaDelClub | undefined) => (dia ? `${dia.abre} – ${dia.cierra}` : "Cerrado");

function nombrarTramo(desde: DiaDeLaSemana, hasta: DiaDeLaSemana): string {
  if (desde === hasta) return NOMBRE[desde];
  const seguidos = ORDEN.indexOf(hasta) - ORDEN.indexOf(desde) === 1;
  return `${NOMBRE[desde]} ${seguidos ? "y" : "a"} ${NOMBRE[hasta].toLowerCase()}`;
}

/** Junta los días seguidos con el mismo horario: «Lunes a sábado · 08:00 – 23:00». Los días sin fila están cerrados. */
export function agruparHorario(dias: DiaDelClub[]): TramoDelHorario[] {
  const tramos: { desde: DiaDeLaSemana; hasta: DiaDeLaSemana; horas: string }[] = [];
  for (const dia of ORDEN) {
    const horas = horasDe(dias.find((d) => d.dia === dia));
    const ultimo = tramos.at(-1);
    if (ultimo?.horas === horas) ultimo.hasta = dia;
    else tramos.push({ desde: dia, hasta: dia, horas });
  }
  return tramos.map(({ desde, hasta, horas }) => ({ dias: nombrarTramo(desde, hasta), horas }));
}
