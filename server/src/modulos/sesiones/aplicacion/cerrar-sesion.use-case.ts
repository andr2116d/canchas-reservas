import type { SesionRepository } from '../dominio/sesion.repository';
import type { GeneradorTokenSesion } from './generador-token-sesion.port';

/** Revoca la sesión asociada a la cookie de la solicitud. */
export class CerrarSesionUseCase {
  constructor(
    private readonly sesiones: SesionRepository,
    private readonly generador: GeneradorTokenSesion,
  ) {}

  async ejecutar(token?: string): Promise<void> {
    if (token) await this.sesiones.eliminar(this.generador.hashear(token));
  }
}
