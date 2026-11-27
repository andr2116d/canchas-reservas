import { ConflictoError } from '../../../compartido/dominio/dominio.error';

/** El precio o el adelanto cambiaron desde que se mostraron: se devuelven los nuevos. */
export class MontosCambiaronError extends ConflictoError {
  constructor(montos: { precio: string; adelanto: string }) {
    super(
      'El precio de este turno cambió. Revisa los montos nuevos y confirma otra vez.',
      {},
      montos,
    );
  }
}
