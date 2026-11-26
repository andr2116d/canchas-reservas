const DIAS_DE_VIGENCIA = 7;
const DIA = 24 * 60 * 60 * 1000;

/** Una contraseña temporal sirve por 7 días desde que se asigna. */
export function vencimientoDeTemporal(ahora: Date): Date {
  return new Date(ahora.getTime() + DIAS_DE_VIGENCIA * DIA);
}

/** Vence al llegar a su fecha; sin fecha, la contraseña no es temporal. */
export function temporalVencida(
  venceEn: Date | undefined,
  ahora: Date,
): boolean {
  return venceEn !== undefined && ahora >= venceEn;
}

/** Contraseña temporal lista para guardar: su hash y hasta cuándo sirve. */
export interface ContrasenaTemporal {
  hash: string;
  venceEn: Date;
}
