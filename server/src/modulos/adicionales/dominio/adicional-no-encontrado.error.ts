import { NoEncontradoError } from '../../../compartido/dominio/dominio.error';

export class AdicionalNoEncontradoError extends NoEncontradoError {
  constructor() {
    super('El adicional no existe.');
  }
}
