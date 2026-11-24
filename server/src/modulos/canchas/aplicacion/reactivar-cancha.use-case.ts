import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { CanchaRepository } from '../dominio/cancha.repository';
import { buscarCancha } from './comprobaciones-de-cancha';

/** Vuelve a poner operativa una cancha desactivada. */
export class ReactivarCanchaUseCase {
  constructor(
    private readonly canchas: Pick<CanchaRepository, 'buscar' | 'guardar'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const cancha = await buscarCancha(this.canchas, id);
    cancha.reactivar();
    await this.canchas.guardar(cancha, {
      accion: 'REACTIVACION',
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
  }
}
