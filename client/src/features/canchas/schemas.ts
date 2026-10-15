import { z } from "zod";

export const MENSAJES_CANCHA = {
  nombreObligatorio: "El nombre es obligatorio",
  nombreLongitud: "El nombre debe tener entre 3 y 40 caracteres",
  tamano: "Elige Fútbol 5 o Fútbol 7",
  iluminacion: "Indica si la cancha tiene iluminación",
  estado: "Elige Operativa o En mantenimiento",
};

export const esquemaCancha = z.object({
  nombre: z
    .string(MENSAJES_CANCHA.nombreObligatorio)
    .trim()
    .min(1, MENSAJES_CANCHA.nombreObligatorio)
    .min(3, MENSAJES_CANCHA.nombreLongitud)
    .max(40, MENSAJES_CANCHA.nombreLongitud),
  tamano: z.string(MENSAJES_CANCHA.tamano).pipe(z.enum(["FUTBOL_5", "FUTBOL_7"], MENSAJES_CANCHA.tamano)),
  iluminacion: z.boolean(MENSAJES_CANCHA.iluminacion),
  estado: z.string(MENSAJES_CANCHA.estado).pipe(z.enum(["OPERATIVA", "EN_MANTENIMIENTO"], MENSAJES_CANCHA.estado)),
});

export type ValoresCancha = z.input<typeof esquemaCancha>;
export type DatosCancha = z.output<typeof esquemaCancha>;
