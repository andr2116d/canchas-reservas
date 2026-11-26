import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import type { AdicionalRepository } from '../dominio/adicional.repository';
import { buscarAdicional } from './comprobaciones-de-adicional';
import type { UsosDeAdicional } from './usos-de-adicional.port';

/**
 * Elimina un adicional creado por error. Solo si nunca se usó: si se usó, se
 * desactiva para conservar los cobros. La auditoría guarda su nombre.
 */
export class EliminarAdicionalUseCase {
  constructor(
    private readonly adicionales: Pick<
      AdicionalRepository,
      'buscar' | 'eliminar'
    >,
    private readonly usos: UsosDeAdicional,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const adicional = await buscarAdicional(this.adicionales, id);
    if ((await this.usos.conUsos([id])).has(id))
      throw new ConflictoError(
        'El adicional ya se usó en reservas. Desactívalo en lugar de eliminarlo.',
        {},
      );
    await this.adicionales.eliminar(adicional, {
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
  }
}
