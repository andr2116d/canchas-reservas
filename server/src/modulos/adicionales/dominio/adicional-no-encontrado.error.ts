import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

export class AdicionalNoEncontradoError extends NoEncontradoError {
  constructor() {
    super('No encontramos el adicional.');
  }
}
