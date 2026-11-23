import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { ReglasDeCorreo } from '../dominio/reglas-de-correo';

export const CONTEXTO_DE_CUENTAS = Symbol('CONTEXTO_DE_CUENTAS');

/** Reloj y reglas del correo por rol: los usan el registro, el alta del personal y el inicio de sesión. */
export interface ContextoDeCuentas {
  reloj: Reloj;
  correos: ReglasDeCorreo;
}
