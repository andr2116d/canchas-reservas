import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

export type DatoEditable =
  'nombres' | 'apellidos' | 'fechaNacimiento' | 'correo' | 'celular' | 'dorsal';

/**
 * Lo que cada persona cambia de su propia cuenta. El documento la identifica: su
 * número nunca se cambia. El correo de la recepcionista lo asigna administración.
 */
export const DATOS_EDITABLES: Record<RolUsuario, DatoEditable[]> = {
  JUGADOR: ['correo', 'celular', 'dorsal'],
  RECEPCIONISTA: ['nombres', 'apellidos', 'fechaNacimiento', 'celular'],
  ADMINISTRADOR: [
    'nombres',
    'apellidos',
    'fechaNacimiento',
    'correo',
    'celular',
  ],
};
