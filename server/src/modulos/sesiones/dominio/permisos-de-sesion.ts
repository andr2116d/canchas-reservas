import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

const PERMISOS_COMUNES = ['sesion:consultar'] as const;
const PERMISOS_TEMPORALES = [
  ...PERMISOS_COMUNES,
  'sesion:cambiar-contrasena-temporal',
] as const;

const PERMISOS_POR_ROL = {
  ADMINISTRADOR: [
    'panel:administracion',
    'personal:gestionar-recepcionistas',
    'cuenta:propia',
    'tarifas:gestionar',
    'tarifas:calcular',
  ],
  RECEPCIONISTA: ['panel:recepcion', 'cuenta:propia', 'tarifas:calcular'],
  JUGADOR: ['panel:jugador', 'cuenta:propia', 'tarifas:calcular'],
} as const satisfies Record<RolUsuario, readonly string[]>;

export type Permiso =
  | (typeof PERMISOS_TEMPORALES)[number]
  | (typeof PERMISOS_POR_ROL)[RolUsuario][number];

export interface AccesoDeSesion {
  rol: RolUsuario;
  requiereCambiarContrasena: boolean;
  /** En esta sesión se eligió cambiar la contraseña temporal más tarde. */
  cambioOmitido?: boolean;
}

/**
 * Con contraseña temporal solo se puede cambiarla, salvo que en esa sesión se
 * haya omitido el cambio: entonces abre su panel y aún puede cambiarla.
 */
function permisosDe(acceso: AccesoDeSesion): readonly Permiso[] {
  const delRol = PERMISOS_POR_ROL[acceso.rol];
  if (!acceso.requiereCambiarContrasena)
    return [...PERMISOS_COMUNES, ...delRol];
  return acceso.cambioOmitido
    ? [...PERMISOS_TEMPORALES, ...delRol]
    : PERMISOS_TEMPORALES;
}

export function puedeAcceder(
  acceso: AccesoDeSesion,
  permiso?: Permiso,
): boolean {
  return permiso !== undefined && permisosDe(acceso).includes(permiso);
}
