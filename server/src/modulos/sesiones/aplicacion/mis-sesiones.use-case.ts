import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { SesionRepository } from '../dominio/sesion.repository';

/** Una sesión abierta como la ve su dueño; nunca lleva el token. */
export interface VistaDeSesion {
  id: number;
  dispositivo: string | null;
  abiertaEn: string;
  ultimaActividadEn: string;
  /** Es la sesión desde la que se consulta. */
  actual: boolean;
}

interface SesionDeQuienConsulta {
  usuarioId: number;
  tokenHash: string;
}

/** Las sesiones vigentes de la persona y cerrar todas menos la actual. */
export class MisSesionesUseCase {
  constructor(
    private readonly sesiones: Pick<
      SesionRepository,
      'deUsuario' | 'cerrarOtras'
    >,
    private readonly reloj: Reloj,
  ) {}

  async consultar({
    usuarioId,
    tokenHash,
  }: SesionDeQuienConsulta): Promise<VistaDeSesion[]> {
    const ahora = this.reloj.ahora();
    return (await this.sesiones.deUsuario(usuarioId))
      .filter(({ sesion }) => sesion.estaVigente(ahora))
      .map((guardada) => ({
        id: guardada.id,
        dispositivo: guardada.dispositivo ?? null,
        abiertaEn: guardada.abiertaEn.toISOString(),
        ultimaActividadEn: guardada.sesion.ultimaActividadEn.toISOString(),
        actual: guardada.tokenHash === tokenHash,
      }));
  }

  cerrarOtras({ usuarioId, tokenHash }: SesionDeQuienConsulta): Promise<void> {
    return this.sesiones.cerrarOtras(usuarioId, tokenHash);
  }
}
