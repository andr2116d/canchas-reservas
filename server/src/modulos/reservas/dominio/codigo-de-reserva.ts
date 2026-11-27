/** Letras y cifras que se leen sin confundirse: sin 0, O, 1 ni I. */
export const LETRAS_DEL_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LARGO_DEL_CODIGO = 6;

const FORMATO = new RegExp(`^[${LETRAS_DEL_CODIGO}]{${LARGO_DEL_CODIGO}}$`);

export function esCodigoDeReserva(texto: string): boolean {
  return FORMATO.test(texto);
}
