import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

export type DatoEditable = 'correo' | 'celular' | 'dorsal';

/**
 * Lo que cada persona puede cambiar de su propia cuenta. Documento, nombres,
 * apellidos y fecha de nacimiento la identifican: no se cambian desde la cuenta.
 * El correo del personal es institucional y lo asigna el administrador.
 */
export const DATOS_EDITABLES: Record<RolUsuario, DatoEditable[]> = {
  JUGADOR: ['correo', 'celular', 'dorsal'],
  RECEPCIONISTA: ['celular'],
  ADMINISTRADOR: ['celular'],
};
