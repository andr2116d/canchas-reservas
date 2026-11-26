import { z } from "zod";
import { DIAS_DE_LA_SEMANA, minutosDe } from "@/compartido/horario/horario";

// Las mismas reglas que aplica el server.
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const CIERRE = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
const FORMATO = "Ingresa la hora como HH:MM, por ejemplo 18:00.";
const CIERRE_ANTES_DE_LA_APERTURA = "El cierre debe ser después de la apertura.";

type Marcar = (camino: (string | number)[], mensaje: string) => void;

/** Revisa que las horas tengan formato y que el cierre sea posterior a la apertura. */
function revisarHoras(horas: { abre: string; cierra: string; inicioDeLaNoche: string }, marcar: Marcar, base: (string | number)[]) {
  if (!HORA.test(horas.inicioDeLaNoche)) marcar([...base, "inicioDeLaNoche"], FORMATO);
  if (!HORA.test(horas.abre)) return marcar([...base, "abre"], FORMATO);
  if (!CIERRE.test(horas.cierra)) return marcar([...base, "cierra"], FORMATO);
  if (minutosDe(horas.cierra) <= minutosDe(horas.abre)) marcar([...base, "cierra"], CIERRE_ANTES_DE_LA_APERTURA);
}

const diaDistinto = z.object({ dia: z.enum(DIAS_DE_LA_SEMANA), abre: z.string(), cierra: z.string(), inicioDeLaNoche: z.string() });

/** Un horario general para los días que abre, y los días que abren a otra hora. */
export const esquemaDeHorario = z
  .object({
    abre: z.string(),
    cierra: z.string(),
    inicioDeLaNoche: z.string(),
    abiertos: z.array(z.enum(DIAS_DE_LA_SEMANA)),
    distintos: z.array(diaDistinto),
  })
  .superRefine((horario, contexto) => {
    const marcar: Marcar = (camino, mensaje) => contexto.addIssue({ code: "custom", path: camino, message: mensaje });
    revisarHoras(horario, marcar, []);
    horario.distintos.forEach((distinto, indice) => {
      if (horario.abiertos.includes(distinto.dia)) revisarHoras(distinto, marcar, ["distintos", indice]);
    });
  });

export type DatosDelFormularioDeHorario = z.infer<typeof esquemaDeHorario>;
export type DiaDistinto = z.infer<typeof diaDistinto>;
