export const ZONA_LIMA = 'America/Lima';

export function inicioDeHoyEnLima(ahora = new Date()) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_LIMA }).format(
    ahora,
  );
  return new Date(`${hoy}T00:00:00.000Z`);
}

export function instanteEnLima(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00-05:00`);
}
