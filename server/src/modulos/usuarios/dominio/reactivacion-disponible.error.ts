import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/**
 * El documento o el correo pertenecen a una recepcionista desactivada: en vez
 * de crear otra cuenta, se ofrece reactivar la existente con su historial.
 */
export class ReactivacionDisponibleError extends ConflictoError {
  constructor(cuenta: { id: number; nombres: string }) {
    super(
      'Esta persona ya tuvo una cuenta de recepción. Reactívala para recuperar sus datos.',
      {},
      { reactivable: cuenta },
    );
  }
}
