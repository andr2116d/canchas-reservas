import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Un adicional que una reserva ya pidió no se elimina: se desactiva y la reserva lo conserva. */
export class AdicionalUsadoError extends ConflictoError {
  constructor() {
    super(
      'El adicional ya se usó en reservas. Desactívalo en lugar de eliminarlo.',
      {},
    );
  }
}
