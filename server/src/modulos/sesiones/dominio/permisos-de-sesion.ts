import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';

const PERMISOS_COMUNES = ['sesion:consultar'] as const;
const PERMISOS_TEMPORALES = [
  ...PERMISOS_COMUNES,
  'sesion:cambiar-contrasena-temporal',
] as const;
const PERMISOS_SIN_DATOS = [
  ...PERMISOS_COMUNES,
  'cuenta:completar-datos',
] as const;

const PERMISOS_POR_ROL = {
  ADMINISTRADOR: [
    'panel:administracion',
    'personal:gestionar-recepcionistas',
    'cuenta:propia',
    'tarifas:gestionar',
    'tarifas:calcular',
    'horario:gestionar',
    'cancelacion:gestionar',
    'adelanto:gestionar',
    'canchas:gestionar',
    'adicionales:gestionar',
    'historial:consultar',
    'reclamos:gestionar',
  ],
  RECEPCIONISTA: ['panel:recepcion', 'cuenta:propia', 'tarifas:calcular'],
  JUGADOR: [
    'panel:jugador',
    'cuenta:propia',
    'tarifas:calcular',
    'reservas:separar',
  ],
} as const satisfies Record<RolUsuario, readonly string[]>;

export type Permiso =
  | (typeof PERMISOS_TEMPORALES)[number]
  | (typeof PERMISOS_SIN_DATOS)[number]
  | (typeof PERMISOS_POR_ROL)[RolUsuario][number];

export interface AccesoDeSesion {
  rol: RolUsuario;
  requiereCambiarContrasena: boolean;
  /** En esta sesión se eligió cambiar la contraseña temporal más tarde. */
  cambioOmitido?: boolean;
  /** Personal que aún no completó o confirmó sus datos. */
  requiereCompletarDatos?: boolean;
}

/**
 * Primero se completan los datos; luego, con contraseña temporal, solo se puede
 * cambiarla, salvo que en esa sesión se haya omitido: entonces abre su panel.
 */
function permisosDe(acceso: AccesoDeSesion): readonly Permiso[] {
  if (acceso.requiereCompletarDatos) return PERMISOS_SIN_DATOS;
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
