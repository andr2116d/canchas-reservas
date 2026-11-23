import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

/** El id no corresponde a ninguna recepcionista. */
export class RecepcionistaNoEncontradaError extends NoEncontradoError {
  constructor() {
    super('No encontramos a esa recepcionista.');
  }
}
