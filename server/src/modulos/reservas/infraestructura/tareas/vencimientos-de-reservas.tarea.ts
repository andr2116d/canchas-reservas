import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpirarReservasVencidasUseCase } from '../../aplicacion/expirar-reservas-vencidas.use-case';

/**
 * Cada minuto pasa a expiradas las reservas que vencieron sin pago. El turno ya se ve libre
 * desde que vence; esto deja el estado y el aviso. Varias instancias a la vez no duplican nada.
 */
@Injectable()
export class VencimientosDeReservasTarea {
  private readonly registro = new Logger('VencimientosDeReservas');

  constructor(private readonly expirar: ExpirarReservasVencidasUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'vencimientos-de-reservas' })
  async ejecutar(): Promise<void> {
    try {
      await this.expirar.ejecutar();
    } catch (error) {
      this.registro.error(
        'No se pudieron expirar las reservas vencidas.',
        error,
      );
    }
  }
}
