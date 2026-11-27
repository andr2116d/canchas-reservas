import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Ya hay tantas reservas esperando pago como se permite. */
export class LimiteDePendientesError extends ConflictoError {
  constructor(maximo: number) {
    super(
      `Ya hay ${maximo} reservas esperando pago. Para separar otra, paga una o espera a que venza.`,
      {},
    );
  }
}
