import { z } from "zod";
import { campoCon, type Regla } from "@/compartido/formulario/reglas-de-datos-personales";

const reglaDeLosMinutos: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa los minutos para pagar.";
  const minutos = Number(limpio);
  if (!/^[1-9]\d{0,3}$/.test(limpio) || minutos > 1440) return "Usa un número entero de minutos, de 1 a 1440.";
};

export const esquemaDelPlazo = z.object({ minutos: campoCon(reglaDeLosMinutos) });

export type DatosDelPlazo = z.infer<typeof esquemaDelPlazo>;

/** Solo dígitos, hasta 4: lo demás se descarta al escribir o pegar. */
export const filtrarMinutos = (valor: string): string => valor.replace(/\D/g, "").slice(0, 4);
