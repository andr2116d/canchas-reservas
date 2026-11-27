import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** Administración aún no definió algo que la reserva debe mostrar antes de separarse. */
export class ReservasSinConfigurarError extends ConflictoError {
  constructor(falta: 'el adelanto' | 'la regla de cancelación') {
    super(
      `Todavía no se puede reservar: falta que administración defina ${falta}.`,
      {},
    );
  }
}
