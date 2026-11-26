const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIA_CORTO = new Intl.DateTimeFormat("es-PE", { weekday: "short", timeZone: "UTC" });
const DIA_LARGO = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const MES = new Intl.DateTimeFormat("es-PE", { month: "long", timeZone: "UTC" });

const aFecha = (texto: string) => new Date(`${texto}T00:00:00Z`);
const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** Las fechas de `desde` a `hasta`, ambas incluidas, como `AAAA-MM-DD`. */
export function fechasEntre(desde: string, hasta: string): string[] {
  const dias = Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / MS_POR_DIA);
  return Array.from({ length: dias + 1 }, (_, i) => aTexto(new Date(aFecha(desde).getTime() + i * MS_POR_DIA)));
}

/** «Hoy», «Mañana» o el día de la semana abreviado, sin punto: «mié». */
export function nombreCorto(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === aTexto(new Date(aFecha(hoy).getTime() + MS_POR_DIA))) return "Mañana";
  return DIA_CORTO.format(aFecha(fecha)).replace(".", "");
}

/** «miércoles, 25 de noviembre». */
export function nombreLargo(fecha: string): string {
  return DIA_LARGO.format(aFecha(fecha));
}

export const numeroDelDia = (fecha: string) => aFecha(fecha).getUTCDate();

/** El mes, como lo escribe el calendario: «Diciembre». */
export const nombreDelMes = (fecha: string) => MES.format(aFecha(fecha));
