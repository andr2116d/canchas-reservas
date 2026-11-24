import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

/** El id no corresponde a ninguna cancha. */
export class CanchaNoEncontradaError extends NoEncontradoError {
  constructor() {
    super('No encontramos la cancha.');
  }
}
