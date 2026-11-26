import type { AdicionalRepository } from '../dominio/adicional.repository';
import type { UsosDeAdicional } from './usos-de-adicional.port';
import {
  aVista,
  aVistaDeCambio,
  type VistaDeAdicional,
  type VistaDeCambio,
} from './vista-de-adicional';

const CAMBIOS_RECIENTES = 30;

/** El catálogo de adicionales y sus cambios recientes, para administración. */
export class ConsultarAdicionalesUseCase {
  constructor(
    private readonly adicionales: Pick<
      AdicionalRepository,
      'listar' | 'cambios'
    >,
    private readonly usos: UsosDeAdicional,
  ) {}

  async listar(): Promise<VistaDeAdicional[]> {
    const lista = await this.adicionales.listar();
    const usados = await this.usos.conUsos(lista.map((a) => a.id!));
    return lista.map((adicional) =>
      aVista(adicional, !usados.has(adicional.id!)),
    );
  }

  async cambios(): Promise<VistaDeCambio[]> {
    return (await this.adicionales.cambios(CAMBIOS_RECIENTES)).map(
      aVistaDeCambio,
    );
  }
}
