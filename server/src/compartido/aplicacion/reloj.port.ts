export const RELOJ = Symbol('RELOJ');

/** Fuente de la hora actual, reemplazable en pruebas. */
export interface Reloj {
  ahora(): Date;
}
