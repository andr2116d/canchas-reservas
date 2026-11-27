import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** El turno ya no se puede separar: otra persona lo tomó, empezó o dejó de ofrecerse. */
export class TurnoNoDisponibleError extends ConflictoError {
  constructor() {
    super('Este turno ya no está libre. Elige otro.', {});
  }
}
