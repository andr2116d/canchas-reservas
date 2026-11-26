/** Cantidad de horas en texto: «1 hora», «3 horas». */
export function horas(cantidad: number): string {
  return cantidad === 1 ? "1 hora" : `${cantidad} horas`;
}
