import type { PlazoDeCancelacion } from "../servicios/reservas";

const MOMENTO = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Un instante en la hora del local, corto: «vie 27 nov, 19:00». */
export function momentoDelLocal(instante: string): string {
  return MOMENTO.format(new Date(instante)).replace(/\./g, "").replace(/^(\S+),/, "$1");
}

const HORA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** La hora del local de un instante: «19:00». */
export const horaDelLocal = (instante: string) => HORA.format(new Date(instante));

/** Hasta cuándo rige un plazo de cancelación y qué devuelve. */
export function textoDelPlazo({ hasta, porcentaje, ofreceCredito }: PlazoDeCancelacion): { cuando: string; que: string } {
  const cuando = `Hasta el ${momentoDelLocal(hasta)}`;
  if (porcentaje === 0) return { cuando, que: "El adelanto no se devuelve" };
  const credito = ofreceCredito ? ", o crédito si lo prefieres" : "";
  return { cuando, que: `Se devuelve el ${porcentaje} % del adelanto${credito}` };
}

const aCentimos = (monto: string) => Math.round(Number(monto) * 100);

/** Lo que queda por pagar en el local después del adelanto, en soles con dos decimales. */
export function saldoEnElLocal(precio: string, adelanto: string): string {
  return ((aCentimos(precio) - aCentimos(adelanto)) / 100).toFixed(2);
}

/** Segundos como «M:SS». */
export function tiempoRestante(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, "0")}`;
}
