import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { AdicionalRepository } from '../dominio/adicional.repository';
import { buscarAdicional } from './comprobaciones-de-adicional';

type Repositorio = Pick<AdicionalRepository, 'buscar' | 'guardar'>;

/** Desactivado, no se ofrece a recepción ni al jugador. Repetirlo no deja otro registro. */
export class DesactivarAdicionalUseCase {
  constructor(
    private readonly adicionales: Repositorio,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const adicional = await buscarAdicional(this.adicionales, id);
    if (!adicional.desactivar()) return;
    await this.adicionales.guardar(adicional, {
      accion: 'DESACTIVACION',
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
  }
}

/** Vuelve a ofrecer un adicional desactivado. Repetirlo no deja otro registro. */
export class ReactivarAdicionalUseCase {
  constructor(
    private readonly adicionales: Repositorio,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: number, administradorId: number): Promise<void> {
    const adicional = await buscarAdicional(this.adicionales, id);
    if (!adicional.reactivar()) return;
    await this.adicionales.guardar(adicional, {
      accion: 'REACTIVACION',
      ejecutadoPorId: administradorId,
      ocurridoEn: this.reloj.ahora(),
    });
  }
}
