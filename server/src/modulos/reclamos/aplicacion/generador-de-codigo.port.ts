export const GENERADOR_DE_CODIGO = Symbol('GENERADOR_DE_CODIGO');

/** Genera el código de seguimiento de una hoja: 8 caracteres al azar del alfabeto del código. */
export interface GeneradorDeCodigo {
  generar(): string;
}
