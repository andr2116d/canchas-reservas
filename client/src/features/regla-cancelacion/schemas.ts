import { z } from "zod";

export const HORAS_MAXIMAS = 2147483647;

export const MENSAJES_REGLA = {
  horasEntero: "Las horas de anticipación deben ser un número entero",
  horasMinimo: "Las horas de anticipación deben ser mayores o iguales a 0",
  horasMaximo: "Las horas de anticipación no pueden superar 2147483647",
  tipoCompensacion: "Elige Devolución o Crédito",
};

const NUMERO = /^-?\d+(\.\d+)?$/;

export const esquemaRegla = z.object({
  horasAnticipacion: z
    .string(MENSAJES_REGLA.horasEntero)
    .trim()
    .regex(NUMERO, MENSAJES_REGLA.horasEntero)
    .transform(Number)
    .refine(Number.isInteger, MENSAJES_REGLA.horasEntero)
    .refine((horas) => horas >= 0, MENSAJES_REGLA.horasMinimo)
    .refine((horas) => horas <= HORAS_MAXIMAS, MENSAJES_REGLA.horasMaximo),
  tipoCompensacion: z
    .string(MENSAJES_REGLA.tipoCompensacion)
    .pipe(z.enum(["CREDITO", "DEVOLUCION"], MENSAJES_REGLA.tipoCompensacion)),
});

export type ValoresRegla = z.input<typeof esquemaRegla>;
export type DatosReglaFormulario = z.output<typeof esquemaRegla>;
