import type { SemanaEnBorrador } from "@/compartido/horario/borrador";
import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana, type HorarioConsultado, type VistaDelDia } from "@/compartido/horario/horario";
import type { DatosDelFormularioDeHorario, DiaDistinto } from "../esquemas/horario.schema";

// Horas que se proponen al empezar, mientras no haya horario guardado.
const APERTURA_PROPUESTA = "08:00";
const CIERRE_PROPUESTO = "22:00";

/** El horario que más se repite entre los días abiertos; en empate, el del primer día. */
function horarioMasRepetido(abiertos: VistaDelDia[]) {
  const cuentas = new Map<string, number>();
  for (const dia of abiertos) cuentas.set(`${dia.abre}-${dia.cierra}`, (cuentas.get(`${dia.abre}-${dia.cierra}`) ?? 0) + 1);
  const [masRepetido] = [...cuentas.entries()].sort((a, b) => b[1] - a[1]);
  const [abre, cierra] = (masRepetido?.[0] ?? `${APERTURA_PROPUESTA}-${CIERRE_PROPUESTO}`).split("-");
  return { abre, cierra };
}

/** Valores del formulario: el horario guardado o, si no hay, uno propuesto para empezar. */
export function valoresDelFormulario({ vigente, inicioDeLaNochePorDefecto }: HorarioConsultado): DatosDelFormularioDeHorario {
  if (!vigente) {
    return { abre: APERTURA_PROPUESTA, cierra: CIERRE_PROPUESTO, inicioDeLaNoche: inicioDeLaNochePorDefecto, abiertos: [...DIAS_DE_LA_SEMANA], distintos: [] };
  }
  const abiertos = vigente.dias.filter((dia) => dia.abierto);
  const { abre, cierra } = horarioMasRepetido(abiertos);
  const noche = vigente.inicioDeLaNoche;
  const distintos = abiertos
    .filter((dia) => dia.abre !== abre || dia.cierra !== cierra || dia.inicioDeLaNoche)
    .map((dia) => ({ dia: dia.dia, abre: dia.abre ?? abre, cierra: dia.cierra ?? cierra, inicioDeLaNoche: dia.inicioDeLaNoche ?? noche }));
  return { abre, cierra, inicioDeLaNoche: noche, abiertos: abiertos.map((dia) => dia.dia), distintos };
}

function distintoDel(valores: DatosDelFormularioDeHorario, dia: DiaDeLaSemana): DiaDistinto | undefined {
  return valores.distintos.find((distinto) => distinto.dia === dia);
}

/** Lo que se envía a la API: los siete días, los cerrados sin horas y la noche propia solo si cambia. */
export function datosParaGuardar(valores: DatosDelFormularioDeHorario) {
  return {
    inicioDeLaNoche: valores.inicioDeLaNoche,
    dias: DIAS_DE_LA_SEMANA.map((dia) => {
      if (!valores.abiertos.includes(dia)) return { dia, abierto: false };
      const { abre, cierra, inicioDeLaNoche } = distintoDel(valores, dia) ?? { ...valores, inicioDeLaNoche: valores.inicioDeLaNoche };
      const nochePropia = inicioDeLaNoche !== valores.inicioDeLaNoche;
      return { dia, abierto: true, abre, cierra, ...(nochePropia && { inicioDeLaNoche }) };
    }),
  };
}

/** Horario de cada día abierto, con su hora de noche resuelta, para la vista previa. */
export function semanaDelFormulario(valores: DatosDelFormularioDeHorario): SemanaEnBorrador {
  return Object.fromEntries(
    valores.abiertos.map((dia) => {
      const distinto = distintoDel(valores, dia);
      return [dia, distinto ? { abre: distinto.abre, cierra: distinto.cierra, inicioDeLaNoche: distinto.inicioDeLaNoche } : { abre: valores.abre, cierra: valores.cierra, inicioDeLaNoche: valores.inicioDeLaNoche }];
    }),
  );
}

/** El server marca los errores por día (`MARTES.cierra`); aquí van al día distinto o al horario general. */
export function ubicarErrores(errores: Record<string, string>, valores: DatosDelFormularioDeHorario): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensaje]) => {
      const [dia, dato] = campo.split(".");
      if (!dato) return [campo, mensaje];
      const indice = valores.distintos.findIndex((distinto) => distinto.dia === dia);
      return [indice >= 0 ? `distintos.${indice}.${dato}` : dato, mensaje];
    }),
  );
}
