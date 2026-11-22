export const GENERADOR_TOKEN_SESION = Symbol('GENERADOR_TOKEN_SESION');

/** Crea tokens de sesión impredecibles y el hash con el que se guardan. */
export interface GeneradorTokenSesion {
  generar(): string;

  hashear(token: string): string;
}
