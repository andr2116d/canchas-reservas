const DIA_EN_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const DIA_LEGIBLE = new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });

const diaAnterior = (fecha: string) => new Date(Date.parse(`${fecha}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

function tituloDelDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy";
  if (fecha === diaAnterior(hoy)) return "Ayer";
  return DIA_LEGIBLE.format(new Date(`${fecha}T12:00:00Z`)).replace(/\./g, "").replace(/,/g, "");
}

/** Agrupa los registros, ya ordenados, por día de Lima, conservando el orden. */
export function agruparPorDia<T extends { ocurridoEn: string }>(registros: T[], hoy: string): { fecha: string; titulo: string; registros: T[] }[] {
  const grupos: { fecha: string; titulo: string; registros: T[] }[] = [];
  for (const registro of registros) {
    const fecha = DIA_EN_LIMA.format(new Date(registro.ocurridoEn));
    const ultimo = grupos.at(-1);
    if (ultimo?.fecha === fecha) ultimo.registros.push(registro);
    else grupos.push({ fecha, titulo: tituloDelDia(fecha, hoy), registros: [registro] });
  }
  return grupos;
}
