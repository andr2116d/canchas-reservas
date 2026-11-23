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
  /** En esta sesión se eligió cambiar la contraseña temporal más tarde. */
  cambioOmitido?: boolean;
}

/** La contraseña es temporal y en esta sesión todavía no se eligió cambiarla después. */
export function debePedirCambioDeContrasena(
  sesion: Pick<DestinoDeSesion, "requiereCambiarContrasena" | "cambioOmitido">,
): boolean {
  return sesion.requiereCambiarContrasena && !sesion.cambioOmitido;
}

export interface EstadoDeSesion extends DestinoDeSesion {
  venceEn: string;
  /** Hasta cuándo sirve la contraseña temporal, si la contraseña es temporal. */
  contrasenaTemporalVenceEn?: string;
}

export function destinoDeSesion(sesion: DestinoDeSesion): string {
  return debePedirCambioDeContrasena(sesion) ? RUTA_DE_CAMBIO : PANELES[sesion.rol];
}
