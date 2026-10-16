const MS_POR_MINUTO = 60 * 1000;

export function calcularVenceEn(
  creadoEn: Date,
  tiempoLimitePagoMin: number,
  inicioEn: Date,
) {
  const limite = new Date(
    creadoEn.getTime() + tiempoLimitePagoMin * MS_POR_MINUTO,
  );
  return limite < inicioEn ? limite : inicioEn;
}

export function minutosParaPagar(
  ahora: Date,
  tiempoLimitePagoMin: number,
  inicioEn: Date,
) {
  const venceEn = calcularVenceEn(ahora, tiempoLimitePagoMin, inicioEn);
  return Math.floor((venceEn.getTime() - ahora.getTime()) / MS_POR_MINUTO);
}
