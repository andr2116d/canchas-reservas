// La hora del local, sin depender del huso horario de quien mira la pantalla.
const FORMATO = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha y hora en Lima, como «22 nov 2026, 20:30». */
export function fechaEnLima(instante: string | Date): string {
  return FORMATO.format(new Date(instante)).replace(".", "");
}
