export const ESCUCHA_DE_CAMBIOS = Symbol('ESCUCHA_DE_CAMBIOS');

/** Avisa cada vez que cambia algo que se ve en el mapa de turnos, venga de donde venga. */
export interface EscuchaDeCambios {
  escuchar(alCambiar: () => void): Promise<void>;
  dejarDeEscuchar(): Promise<void>;
}
