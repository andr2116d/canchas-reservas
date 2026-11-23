import { z } from "zod";
import {
  campoCon,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";

// Las mismas reglas que aplica el server: soles con hasta dos decimales, punto o coma.
const MONTO = /^(\d+)(?:[.,](\d+))?$/;
const MAXIMO_EN_CENTIMOS = 9_999_999;

const reglaDeMonto: Regla = (valor) => {
  const limpio = valor.trim();
  if (limpio === "") return "Ingresa el monto.";
  const partes = MONTO.exec(limpio);
  if (!partes) return "Ingresa el monto en soles, por ejemplo 50 o 49.90.";
  const [, soles, decimales = ""] = partes;
  if (decimales.length > 2) return "Usa como máximo dos decimales.";
  const centimos = Number(soles) * 100 + Number(decimales.padEnd(2, "0"));
  if (centimos === 0) return "El monto debe ser mayor que cero.";
  if (centimos > MAXIMO_EN_CENTIMOS)
    return "El monto no puede pasar de S/ 99999.99.";
};

const reglaDeDuracion: Regla = (valor) => {
  const horas = Number(valor.trim());
  if (!/^\d+$/.test(valor.trim()) || horas < 1 || horas > 12)
    return "Elige un turno de 1 a 12 horas enteras.";
};

export const esquemaDeTarifa = z.object({
  precioDia: campoCon(reglaDeMonto),
  precioNoche: campoCon(reglaDeMonto),
  duracionDelTurno: campoCon(reglaDeDuracion),
});

export type DatosDeTarifa = z.infer<typeof esquemaDeTarifa>;
