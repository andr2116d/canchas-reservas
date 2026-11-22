import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { SesionRepository } from '../dominio/sesion.repository';
import type { GeneradorTokenSesion } from './generador-token-sesion.port';

export interface SesionValida {
  usuarioId: number;
}

/**
 * Comprueba que el token corresponda a una sesión vigente y renueva su
 * actividad. Devuelve `undefined` ante cualquier token inválido o vencido.
 */
export class ValidarSesionUseCase {
  constructor(
    private readonly sesiones: SesionRepository,
    private readonly generador: GeneradorTokenSesion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(token: string | undefined): Promise<SesionValida | undefined> {
    if (!token) return undefined;
    const sesion = await this.sesiones.buscarPorTokenHash(
      this.generador.hashear(token),
    );
    const ahora = this.reloj.ahora();
    if (!sesion?.estaVigente(ahora)) return undefined;

    await this.sesiones.actualizarActividad(sesion.registrarActividad(ahora));
    return { usuarioId: sesion.usuarioId };
  }
}
