import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { GeneradorDeCodigo } from '../../aplicacion/generador-de-codigo.port';
import {
  ALFABETO_DEL_CODIGO,
  LARGO_DEL_CODIGO,
} from '../../dominio/codigo-de-seguimiento';

/** Códigos al azar con el generador criptográfico de Node: 32^8 combinaciones posibles. */
@Injectable()
export class CryptoGeneradorDeCodigoAdapter implements GeneradorDeCodigo {
  generar(): string {
    return Array.from(
      { length: LARGO_DEL_CODIGO },
      () => ALFABETO_DEL_CODIGO[randomInt(ALFABETO_DEL_CODIGO.length)],
    ).join('');
  }
}
