/** Minutos de espera tras cada intento fallido: el primero se reintenta al minuto. */
const ESPERAS_EN_MINUTOS = [1, 5, 30, 120];

export const MAXIMO_DE_INTENTOS = ESPERAS_EN_MINUTOS.length + 1;

/** Cuándo volver a intentar tras `intentos` fallidos; `null` si ya no se intenta más. */
export function proximoIntento(intentos: number, ahora: Date): Date | null {
  if (intentos >= MAXIMO_DE_INTENTOS) return null;
  const minutos = ESPERAS_EN_MINUTOS[intentos - 1];
  return new Date(ahora.getTime() + minutos * 60 * 1000);
}
