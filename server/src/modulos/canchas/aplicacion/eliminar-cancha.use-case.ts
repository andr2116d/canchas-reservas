import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { CanchaRepository } from '../dominio/cancha.repository';
import { buscarCancha } from './comprobaciones-de-cancha';
import type { ReservasDeCancha } from './reservas-de-cancha.port';

/**
 * Elimina una cancha creada por error. Solo si nunca tuvo reservas: si tuvo,
 * se desactiva para conservar su historial. La auditoría guarda su nombre.
 */
export class EliminarCanchaUseCase {
  constructor(
    private readonly canchas: Pick<CanchaRepository, 'buscar' | 'eliminar'>,
    private readonly reservas: Pick<ReservasDeCancha, 'conReservas'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const cancha = await buscarCancha(this.canchas, id);
    if ((await this.reservas.conReservas([id])).has(id))
      throw new ConflictoError(
        'La cancha tiene reservas registradas. Desactívala en lugar de eliminarla.',
        {},
      );
    await this.canchas.eliminar(cancha, {
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
  }
}
