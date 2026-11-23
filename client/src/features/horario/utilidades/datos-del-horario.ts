import { DIAS_DE_LA_SEMANA, type HorarioConsultado } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario } from "../esquemas/horario.schema";

// Horas que se proponen al empezar, mientras no haya horario guardado.
const APERTURA_PROPUESTA = "08:00";
const CIERRE_PROPUESTO = "22:00";

/** Valores del formulario: el horario vigente o, si no hay, uno propuesto para empezar. */
export function valoresDelFormulario({ vigente, inicioDeLaNochePorDefecto }: HorarioConsultado): DatosDelFormularioDeHorario {
  const general = vigente?.inicioDeLaNoche ?? inicioDeLaNochePorDefecto;
  return {
    inicioDeLaNoche: general,
    dias: DIAS_DE_LA_SEMANA.map((dia) => {
      const guardado = vigente?.dias.find((delDia) => delDia.dia === dia);
      return {
        dia,
        abierto: guardado?.abierto ?? true,
        abre: guardado?.abre ?? APERTURA_PROPUESTA,
        cierra: guardado?.cierra ?? CIERRE_PROPUESTO,
        nochePropia: Boolean(guardado?.inicioDeLaNoche),
        inicioDeLaNoche: guardado?.inicioDeLaNoche ?? general,
      };
    }),
  };
}

/** Lo que se envía a la API: los días cerrados sin horas y la noche propia solo si se eligió. */
export function datosParaGuardar({ inicioDeLaNoche, dias }: DatosDelFormularioDeHorario) {
  return {
    inicioDeLaNoche,
    dias: dias.map(({ dia, abierto, abre, cierra, nochePropia, inicioDeLaNoche: noche }) =>
      abierto ? { dia, abierto, abre, cierra, ...(nochePropia && { inicioDeLaNoche: noche }) } : { dia, abierto },
    ),
  };
}

/** El server marca los errores como `MARTES.cierra`; el formulario, como `dias.1.cierra`. */
export function erroresDelFormulario(errores: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensaje]) => {
      const [dia, dato] = campo.split(".");
      const indice = DIAS_DE_LA_SEMANA.indexOf(dia as (typeof DIAS_DE_LA_SEMANA)[number]);
      return [indice >= 0 && dato ? `dias.${indice}.${dato}` : campo, mensaje];
    }),
  );
}
