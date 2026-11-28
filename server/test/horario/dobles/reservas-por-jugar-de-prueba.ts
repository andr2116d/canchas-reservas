import type {
  ReservaPorJugar,
  ReservasPorJugar,
} from '../../../src/modulos/horario/aplicacion/reservas-por-jugar.port';

/** Reservas por jugar fijas; recuerda desde cuándo se pidieron. */
export class ReservasPorJugarDePrueba implements ReservasPorJugar {
  readonly reservas: ReservaPorJugar[] = [];

  desde(ahora: Date): Promise<ReservaPorJugar[]> {
    return Promise.resolve(this.reservas.filter((r) => r.inicio > ahora));
  }
}

/** Una reserva confirmada de Lucía Ramos en Cancha 1, el sábado 28 de noviembre de 19:00 a 20:00. */
export function unaReservaPorJugar(
  cambios: Partial<ReservaPorJugar> = {},
): ReservaPorJugar {
  return {
    codigo: '7K3Q9X',
    cancha: 'Cancha 1',
    inicio: new Date('2026-11-28T19:00:00-05:00'),
    fin: new Date('2026-11-28T20:00:00-05:00'),
    estado: 'CONFIRMADA',
    titular: { nombre: 'Lucía Ramos Vega', celular: '987654321' },
    ...cambios,
  };
}
