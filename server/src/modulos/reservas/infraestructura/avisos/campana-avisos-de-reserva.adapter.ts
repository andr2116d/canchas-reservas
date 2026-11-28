import { Injectable, Logger } from '@nestjs/common';
import { AvisarUseCase } from '../../../avisos/api-avisos';
import type { AvisosDeReserva } from '../../aplicacion/avisos-de-reserva.port';

/** Deja los avisos en la campana; una falla se registra sin deshacer la reserva. */
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

  async reservaVencida(codigo: string, titularId: number): Promise<void> {
    try {
      await this.avisar.a(titularId, 'RESERVA_VENCIDA', codigo);
    } catch (error) {
      this.registro.error(`No se pudo avisar que venció ${codigo}.`, error);
    }
  }
}
