import { z } from "zod";

export const MENSAJES_HORARIO = {
  formatoHora: "La hora debe tener el formato HH:mm, de 00:00 a 23:59",
  cierrePosterior: "La hora de cierre debe ser posterior a la apertura",
  inicioNoche: "Indica la hora en que empieza la noche",
  sieteDias: "Se guardan los 7 días de la semana, uno por cada día",
};

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const esquemaDia = z
  .object({
    diaSemana: z.number().int().min(1).max(7),
    abierto: z.boolean(),
    apertura: z.string(),
    cierre: z.string(),
  })
  .superRefine((dia, ctx) => {
    if (!dia.abierto) return;
    const aperturaValida = FORMATO_HORA.test(dia.apertura);
    if (!aperturaValida) {
      ctx.addIssue({ code: "custom", path: ["apertura"], message: MENSAJES_HORARIO.formatoHora });
    }
    if (!FORMATO_HORA.test(dia.cierre)) {
      ctx.addIssue({ code: "custom", path: ["cierre"], message: MENSAJES_HORARIO.formatoHora });
    } else if (aperturaValida && dia.cierre <= dia.apertura) {
      ctx.addIssue({ code: "custom", path: ["cierre"], message: MENSAJES_HORARIO.cierrePosterior });
    }
  });

export const esquemaHorario = z.object({
  dias: z.array(esquemaDia).length(7, MENSAJES_HORARIO.sieteDias),
  inicioNoche: z.string().regex(FORMATO_HORA, MENSAJES_HORARIO.inicioNoche),
});

export type ValoresHorario = z.input<typeof esquemaHorario>;
export type DatosHorario = z.output<typeof esquemaHorario>;

type DiaRecibido = { diaSemana: number; abierto: boolean; apertura: string | null; cierre: string | null };

export function valoresDeHorario(dias: DiaRecibido[], inicioNoche: string): ValoresHorario {
  return {
    dias: dias.map((dia) => ({
      diaSemana: dia.diaSemana,
      abierto: dia.abierto,
      apertura: dia.apertura ?? "",
      cierre: dia.cierre ?? "",
    })),
    inicioNoche,
  };
}