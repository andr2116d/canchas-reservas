import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { BloqueoNoEncontradoError } from '../dominio/bloqueo-no-encontrado.error';
import type { BloqueoRepository } from '../dominio/bloqueo.repository';

/** Quita entero un bloqueo que aún no empieza. La auditoría conserva qué se quitó. */
export class QuitarBloqueoUseCase {
  constructor(
    private readonly bloqueos: Pick<BloqueoRepository, 'buscar' | 'quitar'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const encontrado = await this.bloqueos.buscar(id);
    if (!encontrado) throw new BloqueoNoEncontradoError();
    const ahora = this.reloj.ahora();
    encontrado.bloqueo.exigirQueNoEmpezo(ahora);
    await this.bloqueos.quitar(encontrado.bloqueo, {
      ejecutadoPorId: administradorId,
      ocurridoEn: ahora,
    });
  }
}
