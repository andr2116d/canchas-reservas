import type { Sesion } from './sesion.entity';

export const SESION_REPOSITORY = Symbol('SESION_REPOSITORY');

/** Puerto de persistencia de sesiones. Las sesiones se buscan por el hash de su token. */
export interface SesionRepository {
  guardar(sesion: Sesion): Promise<void>;

  buscarPorTokenHash(tokenHash: string): Promise<Sesion | undefined>;

  actualizarActividad(sesion: Sesion): Promise<void>;
}
