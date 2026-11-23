// Del verde botella (devuelve todo) al ámbar (se retiene): cuánto se devuelve, de un vistazo.
const TONOS = ["#17573f", "#2c6f4c", "#4f8645", "#7d9439", "#a3902f", "#a87a12"];

export function colorDelPorcentaje(porcentaje: number): string {
  if (porcentaje <= 0) return "#a86b00";
  return TONOS[Math.min(TONOS.length - 1, Math.floor((100 - porcentaje) / 20))];
}
