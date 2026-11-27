import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Solo reserva una cuenta de jugador activa de una persona con 18 años cumplidos. */
export class TitularNoHabilitadoError extends ConflictoError {
  constructor() {
    super(
      'La reserva la hace la persona titular de una cuenta activa, con 18 años cumplidos.',
      {},
    );
  }
}
