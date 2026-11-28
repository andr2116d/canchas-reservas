import { horaEnLima } from "@/compartido/ui/fecha-en-lima";

const ZONA = "America/Lima";

const PARTES = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const DIA = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short" });

/** Fecha `AAAA-MM-DD` y hora `HH:MM` de Lima de un instante. */
export function partesEnLima(instante: Date): { fecha: string; hora: string } {
  const partes = Object.fromEntries(PARTES.formatToParts(instante).map(({ type, value }) => [type, value]));
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

const dia = (instante: Date) => DIA.format(instante).replace(/\./g, "").replace(",", "");

/** Un rango en palabras de Lima: «sáb 28 nov, 08:00 – 14:00», o con flecha si cruza días. */
export function describirRango(inicio: string, fin: string): string {
  const desde = new Date(inicio);
  const hasta = new Date(fin);
  const mismoDia = partesEnLima(desde).fecha === partesEnLima(new Date(hasta.getTime() - 1)).fecha;
  const horaDeFin = partesEnLima(hasta).hora === "00:00" && mismoDia ? "24:00" : horaEnLima(hasta);
  if (mismoDia) return `${dia(desde)}, ${horaEnLima(desde)} – ${horaDeFin}`;
  return `${dia(desde)}, ${horaEnLima(desde)} → ${dia(hasta)}, ${horaEnLima(hasta)}`;
}

/** Hasta cuándo dura algo, visto desde hoy: «14:00» si termina hoy, o con el día si no. */
export function describirHasta(fin: string, hoy: string): string {
  const hasta = new Date(fin);
  const terminaHoy = partesEnLima(new Date(hasta.getTime() - 1)).fecha === hoy;
  const { hora } = partesEnLima(hasta);
  if (terminaHoy) return hora === "00:00" ? "24:00" : hora;
  return `${dia(hasta)}, ${horaEnLima(hasta)}`;
}
