import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { BloqueoNoEncontradoError } from '../dominio/bloqueo-no-encontrado.error';
import type { BloqueoRepository } from '../dominio/bloqueo.repository';

/**
 * Termina antes un bloqueo en curso, por ejemplo si el mantenimiento acabó al
 * mediodía: la cancha vuelve a estar disponible y queda registrado hasta cuándo duró.
 */
export class LiberarBloqueoUseCase {
  constructor(
    private readonly bloqueos: Pick<BloqueoRepository, 'buscar' | 'liberar'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const encontrado = await this.bloqueos.buscar(id);
    if (!encontrado) throw new BloqueoNoEncontradoError();
    const ahora = this.reloj.ahora();
    encontrado.bloqueo.liberar(ahora);
    await this.bloqueos.liberar(encontrado.bloqueo, {
      ejecutadoPorId: administradorId,
      ocurridoEn: ahora,
    });
  }
}
