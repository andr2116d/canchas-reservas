export const GENERADOR_DE_CODIGO = Symbol('GENERADOR_DE_CODIGO');

/** Da códigos de reserva de seis caracteres que se leen sin confundirse (sin 0, O, 1 ni I). */
export interface GeneradorDeCodigo {
  nuevo(): string;
}
