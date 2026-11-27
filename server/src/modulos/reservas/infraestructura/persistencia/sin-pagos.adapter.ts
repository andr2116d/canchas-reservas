import { Injectable } from '@nestjs/common';
import type { Monto } from '../../../../compartido/dominio/monto.value-object';
import type { PagosDeReservas } from '../../aplicacion/pagos-de-reservas.port';

/** Mientras no se cobre en la web ni en el local, ninguna reserva tiene pagos. */
@Injectable()
export class SinPagosAdapter implements PagosDeReservas {
  pagadoPor(): Promise<Map<number, Monto>> {
    return Promise.resolve(new Map());
  }
}
