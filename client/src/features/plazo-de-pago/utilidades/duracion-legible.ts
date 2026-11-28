/** Minutos escritos para leerlos sin calcular: «30 minutos», «1 h 30 min», «24 h». */
export function duracionLegible(minutos: number): string {
  if (minutos < 60) return `${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}
