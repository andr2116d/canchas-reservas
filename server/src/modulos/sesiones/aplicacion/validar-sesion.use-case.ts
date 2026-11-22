import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { AccesoDeSesion } from '../dominio/permisos-de-sesion';
import type { SesionRepository } from '../dominio/sesion.repository';
import type { GeneradorTokenSesion } from './generador-token-sesion.port';

export interface SesionValida extends AccesoDeSesion {
  usuarioId: number;
  tokenHash: string;
  venceEn: Date;
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

  async ejecutar(
    token: string | undefined,
    renovar: (acceso: AccesoDeSesion) => boolean = () => true,
  ): Promise<SesionValida | undefined> {
    if (!token) return undefined;
    const acceso = await this.sesiones.buscarPorTokenHash(
      this.generador.hashear(token),
    );
    const ahora = this.reloj.ahora();
    if (!acceso?.activa || !acceso.sesion.estaVigente(ahora)) return undefined;

    const { rol, requiereCambiarContrasena } = acceso;
    let sesion = acceso.sesion;
    if (renovar(acceso)) {
      sesion = sesion.registrarActividad(ahora);
      if (!(await this.sesiones.actualizarActividad(sesion))) return undefined;
    }

    return {
      usuarioId: sesion.usuarioId,
      tokenHash: sesion.tokenHash,
      rol,
      requiereCambiarContrasena,
      venceEn: sesion.venceEn(),
    };
  }
}
