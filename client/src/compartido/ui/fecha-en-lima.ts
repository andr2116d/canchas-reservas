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

const HORA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** La hora del local en ese instante, como «19:15». */
export function horaEnLima(instante: string | Date): string {
  return HORA.format(new Date(instante));
}

/** Suma (o resta, con días negativos) días a una fecha `AAAA-MM-DD` del calendario, sin husos horarios. */
export function sumarDias(fecha: string, dias: number): string {
  const momento = new Date(`${fecha}T12:00:00.000Z`);
  momento.setUTCDate(momento.getUTCDate() + dias);
  return momento.toISOString().slice(0, 10);
}
