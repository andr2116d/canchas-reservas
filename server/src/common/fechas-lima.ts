export const ZONA_LIMA = 'America/Lima';

export function instanteEnLima(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00-05:00`);
}

export function fechaEnLima(instante: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_LIMA }).format(
    instante,
  );
}

export function sumarDias(fecha: string, dias: number) {
  const dia = new Date(`${fecha}T00:00:00.000Z`);
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}
