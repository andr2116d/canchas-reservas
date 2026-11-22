import type { Reloj } from '../../aplicacion/reloj.port';

/** Hora real del sistema. */
export class SistemaRelojAdapter implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
