export const RUTA_DE_ACCESO = "/iniciar-sesion";
export const RUTA_DE_CAMBIO = "/cambiar-contrasena";
export const RUTA_DE_DATOS = "/completar-datos";

export const PANELES = {
  JUGADOR: "/inicio",
  RECEPCIONISTA: "/recepcion",
  ADMINISTRADOR: "/administracion",
} as const;

export type Rol = keyof typeof PANELES;

export interface DestinoDeSesion {
  rol: Rol;
  /** Personal que aún no completó o confirmó sus datos: es lo primero que hace. */
  requiereCompletarDatos?: boolean;
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

/** Primero los datos, luego la contraseña temporal y, al final, el panel del rol. */
export function destinoDeSesion(sesion: DestinoDeSesion): string {
  if (sesion.requiereCompletarDatos) return RUTA_DE_DATOS;
  return debePedirCambioDeContrasena(sesion) ? RUTA_DE_CAMBIO : PANELES[sesion.rol];
}
