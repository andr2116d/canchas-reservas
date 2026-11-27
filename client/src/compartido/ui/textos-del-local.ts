const DIA_LARGO = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Un monto de la API en soles, como «S/ 80.00». */
export const enSoles = (monto: string) => `S/ ${monto}`;

/** Una fecha `AAAA-MM-DD` del local escrita completa: «miércoles, 25 de noviembre». */
export function diaLargo(fecha: string): string {
  return DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`));
}
