import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

const PERMISOS_COMUNES = ['sesion:consultar'] as const;
const PERMISOS_TEMPORALES = [
  ...PERMISOS_COMUNES,
  'sesion:cambiar-contrasena-temporal',
] as const;

const PERMISOS_POR_ROL = {
  ADMINISTRADOR: ['panel:administracion', 'personal:crear-recepcionista'],
  RECEPCIONISTA: ['panel:recepcion'],
  JUGADOR: ['panel:jugador'],
} as const satisfies Record<RolUsuario, readonly string[]>;

export type Permiso =
  | (typeof PERMISOS_TEMPORALES)[number]
  | (typeof PERMISOS_POR_ROL)[RolUsuario][number];

export interface AccesoDeSesion {
  rol: RolUsuario;
  requiereCambiarContrasena: boolean;
}

export function puedeAcceder(
  acceso: AccesoDeSesion,
  permiso?: Permiso,
): boolean {
  if (!permiso) return false;
  const permitidos: readonly Permiso[] = acceso.requiereCambiarContrasena
    ? PERMISOS_TEMPORALES
    : [...PERMISOS_COMUNES, ...PERMISOS_POR_ROL[acceso.rol]];
  return permitidos.includes(permiso);
}
