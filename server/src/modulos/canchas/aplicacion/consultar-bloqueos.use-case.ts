import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { BloqueoRepository } from '../dominio/bloqueo.repository';
import { aVistaDeBloqueo, type VistaDeBloqueo } from './vista-de-bloqueo';

const TERMINADOS_RECIENTES = 20;

/** Los bloqueos en curso y próximos, y aparte los últimos que terminaron. */
export class ConsultarBloqueosUseCase {
  constructor(
    private readonly bloqueos: Pick<
      BloqueoRepository,
      'sinTerminar' | 'terminados'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<{
    sinTerminar: VistaDeBloqueo[];
    terminados: VistaDeBloqueo[];
  }> {
    const ahora = this.reloj.ahora();
    const [sinTerminar, terminados] = await Promise.all([
      this.bloqueos.sinTerminar(ahora),
      this.bloqueos.terminados(ahora, TERMINADOS_RECIENTES),
    ]);
    return {
      sinTerminar: sinTerminar.map((b) => aVistaDeBloqueo(b, ahora)),
      terminados: terminados.map((b) => aVistaDeBloqueo(b, ahora)),
    };
  }
}
