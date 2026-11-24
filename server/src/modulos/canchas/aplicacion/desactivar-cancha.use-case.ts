import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { CanchaRepository } from '../dominio/cancha.repository';
import {
  buscarCancha,
  exigirSinReservasPorJugar,
} from './comprobaciones-de-cancha';
import type { ReservasDeCancha } from './reservas-de-cancha.port';

/**
 * Desactiva una cancha: deja de aparecer en la disponibilidad y no admite
 * reservas nuevas. Solo si no tiene ninguna reserva por jugar, ni siquiera de hoy.
 */
export class DesactivarCanchaUseCase {
  constructor(
    private readonly canchas: Pick<CanchaRepository, 'buscar' | 'guardar'>,
    private readonly reservas: Pick<ReservasDeCancha, 'porJugar'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const cancha = await buscarCancha(this.canchas, id);
    const ahora = this.reloj.ahora();
    await exigirSinReservasPorJugar({
      reservas: this.reservas,
      canchaId: id,
      desde: ahora,
      mensaje: 'No se puede desactivar: la cancha tiene reservas por jugar.',
    });
    cancha.desactivar();
    await this.canchas.guardar(cancha, {
      accion: 'DESACTIVACION',
      ejecutadoPorId: administradorId,
      ocurridoEn: ahora,
    });
  }
}
