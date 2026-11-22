import type { Contrasena } from '../dominio/contrasena.value-object';

export const HASHEADOR_CONTRASENA = Symbol('HASHEADOR_CONTRASENA');

/** Convierte una contraseña en un hash irreversible para guardarla. */
export interface HasheadorContrasena {
  hashear(contrasena: Contrasena): Promise<string>;
}
