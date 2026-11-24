import type { CanchaRepository } from '../dominio/cancha.repository';
import type { ReservasDeCancha } from './reservas-de-cancha.port';
import {
  aVista,
  aVistaDeCambio,
  type VistaDeCambio,
  type VistaDeCancha,
} from './vista-de-cancha';

const CAMBIOS_RECIENTES = 30;

/** Las canchas del local y los cambios recientes, para administración. */
export class ConsultarCanchasUseCase {
  constructor(
    private readonly canchas: Pick<CanchaRepository, 'listar' | 'cambios'>,
    private readonly reservas: Pick<ReservasDeCancha, 'conReservas'>,
  ) {}

  async listar(): Promise<VistaDeCancha[]> {
    const canchas = await this.canchas.listar();
    const conReservas = await this.reservas.conReservas(
      canchas.map((cancha) => cancha.id!),
    );
    return canchas.map((cancha) =>
      aVista(cancha, !conReservas.has(cancha.id!)),
    );
  }

  async cambios(): Promise<VistaDeCambio[]> {
    return (await this.canchas.cambios(CAMBIOS_RECIENTES)).map(aVistaDeCambio);
  }
}
