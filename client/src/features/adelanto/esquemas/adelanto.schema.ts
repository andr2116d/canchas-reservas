import { z } from "zod";
import { campoCon, type Regla } from "@/compartido/formulario/reglas-de-datos-personales";

const reglaDelPorcentaje: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa el porcentaje del adelanto.";
  const porcentaje = Number(limpio);
  if (!/^\d{1,3}$/.test(limpio) || porcentaje < 1 || porcentaje > 100) return "Usa un número entero de 1 a 100.";
};

export const esquemaDelAdelanto = z.object({ porcentaje: campoCon(reglaDelPorcentaje) });

export type DatosDelAdelanto = z.infer<typeof esquemaDelAdelanto>;

/** Solo dígitos, hasta 3: lo demás se descarta al escribir o pegar. */
export const filtrarPorcentaje = (valor: string): string => valor.replace(/\D/g, "").slice(0, 3);
