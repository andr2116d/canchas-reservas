import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import type { ReservaRepository } from '../dominio/reserva.repository';
import type { AvisosDeReserva } from './avisos-de-reserva.port';

/**
 * Pasa a expiradas las reservas que vencieron sin pago y avisa a cada titular. Una reserva
 * con el pago por validar no vence; una ya expirada no cambia.
 */
export class ExpirarReservasVencidasUseCase {
  constructor(
    private readonly reservas: Pick<ReservaRepository, 'expirarVencidas'>,
    private readonly avisos: Pick<AvisosDeReserva, 'reservaVencida'>,
    private readonly reloj: Reloj,
  ) {}

  /** Devuelve cuántas expiró. */
  async ejecutar(): Promise<number> {
    const expiradas = await this.reservas.expirarVencidas(this.reloj.ahora());
    await Promise.all(
      expiradas.map(({ codigo, titularId }) =>
        this.avisos.reservaVencida(codigo, titularId),
      ),
    );
    return expiradas.length;
  }
}
