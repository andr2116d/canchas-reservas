import type { Sesion } from './sesion.entity';
import type { AccesoDeSesion } from './permisos-de-sesion';

export const SESION_REPOSITORY = Symbol('SESION_REPOSITORY');

export interface SesionConAcceso extends AccesoDeSesion {
  sesion: Sesion;
  activa: boolean;
  /** Hasta cuándo sirve la contraseña temporal; nada si no es temporal. */
  contrasenaTemporalVenceEn?: Date;
}

/** Puerto de persistencia de sesiones. Las sesiones se buscan por el hash de su token. */
export interface SesionRepository {
  guardar(sesion: Sesion): Promise<void>;

  buscarPorTokenHash(tokenHash: string): Promise<SesionConAcceso | undefined>;

  actualizarActividad(sesion: Sesion): Promise<boolean>;

  eliminar(tokenHash: string): Promise<void>;

  /** Marca que en esta sesión se cambiará la contraseña temporal más tarde. */
  omitirCambio(tokenHash: string): Promise<void>;
}
