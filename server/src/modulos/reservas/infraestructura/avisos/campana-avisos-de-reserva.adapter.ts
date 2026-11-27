import { Injectable, Logger } from '@nestjs/common';
import { AvisarUseCase } from '../../../avisos/api-avisos';
import type { AvisosDeReserva } from '../../aplicacion/avisos-de-reserva.port';

/** Deja los avisos en la campana del personal; una falla se registra sin deshacer la reserva. */
@Injectable()
export class CampanaAvisosDeReservaAdapter implements AvisosDeReserva {
  private readonly registro = new Logger('AvisosDeReserva');

  constructor(private readonly avisar: AvisarUseCase) {}

  async nuevaReserva(codigo: string): Promise<void> {
    try {
      await Promise.all([
        this.avisar.alRol('RECEPCIONISTA', 'NUEVA_RESERVA', codigo),
        this.avisar.alRol('ADMINISTRADOR', 'NUEVA_RESERVA', codigo),
      ]);
    } catch (error) {
      this.registro.error(`No se pudo avisar la reserva ${codigo}.`, error);
    }
  }
}
