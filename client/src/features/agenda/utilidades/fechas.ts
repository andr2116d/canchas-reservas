const HORA_DE_LIMA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Suma días a una fecha `AAAA-MM-DD` del calendario, sin husos horarios de por medio. */
export function sumarDias(fecha: string, dias: number): string {
  const momento = new Date(`${fecha}T12:00:00.000Z`);
  momento.setUTCDate(momento.getUTCDate() + dias);
  return momento.toISOString().slice(0, 10);
}

/** La hora del local en ese instante, como «19:15». */
export const horaEnLima = (instante: string) => HORA_DE_LIMA.format(new Date(instante));
