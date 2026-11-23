const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Cuánto falta para una fecha: en días redondeados, o en horas si queda menos de un día. */
export function describirTiempoRestante(venceEn: string, ahora: Date): string {
  const falta = Date.parse(venceEn) - ahora.getTime();
  if (falta >= DIA) {
    const dias = Math.round(falta / DIA);
    return dias === 1 ? "1 día" : `${dias} días`;
  }
  if (falta >= HORA) {
    const horas = Math.floor(falta / HORA);
    return horas === 1 ? "1 hora" : `${horas} horas`;
  }
  return "menos de una hora";
}
