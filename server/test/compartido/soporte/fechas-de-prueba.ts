import {
  fechaEnLima,
  sumarAFecha,
} from '../../../src/compartido/dominio/momento-en-lima';

/** La fecha de Lima dentro de tantos días desde hoy, para que lo que se agenda siempre sea futuro. */
export const dentroDe = (dias: number) =>
  sumarAFecha(fechaEnLima(new Date()), { dias });
