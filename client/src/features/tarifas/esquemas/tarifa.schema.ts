import { z } from "zod";
import { reglaDeMonto } from "@/compartido/formulario/regla-de-monto";
import {
  campoCon,
  type Regla,
} from "@/compartido/formulario/reglas-de-datos-personales";

const reglaDeDuracion: Regla = (valor) => {
  const horas = Number(valor.trim());
  if (!/^\d+$/.test(valor.trim()) || horas < 1 || horas > 12)
    return "Elige un turno de 1 a 12 horas enteras.";
};

export const esquemaDeTarifa = z.object({
  precioDia: campoCon(reglaDeMonto),
  precioNoche: campoCon(reglaDeMonto),
  duracionDelTurno: campoCon(reglaDeDuracion),
  ofreceTurnoCorto: z.boolean(),
});

export type DatosDeTarifa = z.infer<typeof esquemaDeTarifa>;
