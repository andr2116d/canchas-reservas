import { z } from "zod";
import { DIAS_DE_LA_SEMANA, minutosDe } from "@/compartido/horario/horario";

// Las mismas reglas que aplica el server.
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const CIERRE = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
const FORMATO = "Ingresa la hora como HH:MM, por ejemplo 18:00.";
export const CIERRE_ANTES_DE_LA_APERTURA = "El cierre debe ser después de la apertura.";

const diaDelFormulario = z
  .object({
    dia: z.enum(DIAS_DE_LA_SEMANA),
    abierto: z.boolean(),
    abre: z.string(),
    cierra: z.string(),
    nochePropia: z.boolean(),
    inicioDeLaNoche: z.string(),
  })
  .superRefine((dia, contexto) => {
    const marcar = (campo: "abre" | "cierra" | "inicioDeLaNoche", mensaje: string) =>
      contexto.addIssue({ code: "custom", path: [campo], message: mensaje });
    if (dia.nochePropia && !HORA.test(dia.inicioDeLaNoche)) marcar("inicioDeLaNoche", FORMATO);
    if (!dia.abierto) return;
    if (!HORA.test(dia.abre)) return marcar("abre", FORMATO);
    if (!CIERRE.test(dia.cierra)) return marcar("cierra", FORMATO);
    if (minutosDe(dia.cierra) <= minutosDe(dia.abre)) marcar("cierra", CIERRE_ANTES_DE_LA_APERTURA);
  });

export const esquemaDeHorario = z.object({
  inicioDeLaNoche: z.string().regex(HORA, FORMATO),
  dias: z.array(diaDelFormulario).length(DIAS_DE_LA_SEMANA.length),
});

export type DatosDelFormularioDeHorario = z.infer<typeof esquemaDeHorario>;
export type DiaDelFormulario = DatosDelFormularioDeHorario["dias"][number];
