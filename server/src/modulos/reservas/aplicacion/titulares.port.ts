export const TITULARES = Symbol('TITULARES');

/** Lo que se comprueba de quien reserva. */
export interface DatosDelTitular {
  esJugadorActivo: boolean;
  /** AAAA-MM-DD, o nada si la cuenta no la tiene guardada. */
  fechaNacimiento: string | null;
}

export interface Titulares {
  datosDe(usuarioId: number): Promise<DatosDelTitular | undefined>;
}
