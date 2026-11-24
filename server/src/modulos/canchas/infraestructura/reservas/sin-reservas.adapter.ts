import { Injectable } from '@nestjs/common';
import type {
  ReservaAfectada,
  ReservasDeCancha,
} from '../../aplicacion/reservas-de-cancha.port';

/**
 * El sistema todavía no guarda reservas, así que ninguna cancha tiene reservas.
 * Se reemplaza por el adaptador que consulte las reservas cuando existan.
 */
@Injectable()
export class SinReservasAdapter implements ReservasDeCancha {
  porJugar(): Promise<ReservaAfectada[]> {
    return Promise.resolve([]);
  }

  enRangos(): Promise<(ReservaAfectada & { canchaId: number })[]> {
    return Promise.resolve([]);
  }

  conReservas(): Promise<Set<number>> {
    return Promise.resolve(new Set());
  }
}
