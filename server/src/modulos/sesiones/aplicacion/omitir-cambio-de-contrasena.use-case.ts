import type { SesionRepository } from '../dominio/sesion.repository';
import type { SesionValida } from './validar-sesion.use-case';

/**
 * La persona elige cambiar su contraseña temporal más tarde. Vale solo para
 * esta sesión: cada inicio de sesión nuevo vuelve a pedir el cambio.
 */
export class OmitirCambioDeContrasenaUseCase {
  constructor(
    private readonly sesiones: Pick<SesionRepository, 'omitirCambio'>,
  ) {}

  async ejecutar(sesion: SesionValida): Promise<void> {
    if (!sesion.requiereCambiarContrasena) return;
    await this.sesiones.omitirCambio(sesion.tokenHash);
  }
}
