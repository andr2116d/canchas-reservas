import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { GeneradorDeCodigo } from '../../aplicacion/generador-de-codigo.port';
import {
  LARGO_DEL_CODIGO,
  LETRAS_DEL_CODIGO,
} from '../../dominio/codigo-de-reserva';

/** Códigos al azar con el generador seguro de Node. */
@Injectable()
export class CryptoGeneradorDeCodigoAdapter implements GeneradorDeCodigo {
  nuevo(): string {
    return Array.from(
      { length: LARGO_DEL_CODIGO },
      () => LETRAS_DEL_CODIGO[randomInt(LETRAS_DEL_CODIGO.length)],
    ).join('');
  }
}
