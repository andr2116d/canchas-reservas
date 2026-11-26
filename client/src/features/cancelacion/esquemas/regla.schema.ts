import { z } from "zod";
import { campoCon } from "@/compartido/formulario/reglas-de-datos-personales";

/** Entero de 0 al máximo, con los mismos mensajes que el server. Las demás reglas las dice el server. */
function entero(maximo: number, vacio: string, invalido: string) {
  return campoCon((valor) => {
    const limpio = valor.trim();
    if (limpio === "") return vacio;
    if (!/^\d+$/.test(limpio) || Number(limpio) > maximo) return invalido;
  });
}

export const esquemaDeLaRegla = z.object({
  rangos: z
    .array(
      z.object({
        desdeHoras: entero(720, "Ingresa desde cuántas horas antes rige.", "Usa horas enteras de 0 a 720."),
        porcentaje: entero(100, "Ingresa el porcentaje que se devuelve.", "Usa un porcentaje entero de 0 a 100."),
        ofreceCredito: z.boolean(),
      }),
    )
    .max(10, "Usa como máximo 10 rangos."),
});

export type DatosDeLaRegla = z.infer<typeof esquemaDeLaRegla>;
export type DatosDelRango = DatosDeLaRegla["rangos"][number];
