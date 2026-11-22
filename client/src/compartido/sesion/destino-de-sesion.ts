export const RUTA_DE_ACCESO = "/iniciar-sesion";
export const RUTA_DE_CAMBIO = "/cambiar-contrasena";

export const PANELES = {
  JUGADOR: "/inicio",
  RECEPCIONISTA: "/recepcion",
  ADMINISTRADOR: "/administracion",
} as const;

export type Rol = keyof typeof PANELES;

export interface DestinoDeSesion {
  rol: Rol;
  requiereCambiarContrasena: boolean;
}

export interface EstadoDeSesion extends DestinoDeSesion {
  venceEn: string;
}

export function destinoDeSesion(sesion: DestinoDeSesion): string {
  return sesion.requiereCambiarContrasena ? RUTA_DE_CAMBIO : PANELES[sesion.rol];
}
