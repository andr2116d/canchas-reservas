import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

/** El id no corresponde a ningún bloqueo. */
export class BloqueoNoEncontradoError extends NoEncontradoError {
  constructor() {
    super('No encontramos el bloqueo.');
  }
}
