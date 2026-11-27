import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

export class ReservaNoEncontradaError extends NoEncontradoError {
  constructor() {
    super('No se encontró la reserva.');
  }
}
