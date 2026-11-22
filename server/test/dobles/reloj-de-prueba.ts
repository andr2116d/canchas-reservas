import type { Reloj } from '../../src/compartido/aplicacion/reloj.port';

/** Reloj detenido que la prueba adelanta a voluntad. */
export class RelojDePrueba implements Reloj {
  constructor(private momento = new Date('2026-11-22T10:00:00.000Z')) {}

  ahora(): Date {
    return this.momento;
  }

  avanzarMinutos(minutos: number): void {
    this.momento = new Date(this.momento.getTime() + minutos * 60 * 1000);
  }
}
