import { Monto } from '../../../src/compartido/dominio/monto.value-object';
import type {
  AgendaDelLocal,
  CanchaDeLaAgenda,
  ReservaDeLaAgenda,
} from '../../../src/modulos/reservas/aplicacion/agenda-del-local.port';
import type { PagosDeReservas } from '../../../src/modulos/reservas/aplicacion/pagos-de-reservas.port';

export const CANCHA_1: CanchaDeLaAgenda = {
  id: 1,
  nombre: 'Cancha 1',
  tipo: 'FUTBOL_5',
};
export const CANCHA_2: CanchaDeLaAgenda = {
  id: 2,
  nombre: 'Cancha 2',
  tipo: 'FUTBOL_7',
};

let siguienteId = 1;

/** El 22 de noviembre de 19:00 a 20:00 (Lima), confirmada, de S/ 80 con S/ 40 de adelanto; se cambia lo que la prueba necesita. */
export function unaReservaDeLaAgenda(
  cambios: Partial<ReservaDeLaAgenda> = {},
): ReservaDeLaAgenda {
  const id = siguienteId++;
  return {
    id,
    codigo: `COD${String(id).padStart(3, '0')}`,
    estado: 'CONFIRMADA',
    inicio: new Date('2026-11-23T00:00:00.000Z'),
    fin: new Date('2026-11-23T01:00:00.000Z'),
    venceEn: null,
    cancha: CANCHA_1,
    precio: Monto.crear('80'),
    adelanto: Monto.crear('40'),
    cliente: { nombre: 'Lucía Ramos Vega', celular: '987654321' },
    ...cambios,
  };
}

/** Canchas y reservas fijas; recuerda qué rango de fechas se pidió. */
export class AgendaDelLocalDePrueba implements AgendaDelLocal {
  readonly pedidos: { desde: Date; hasta: Date }[] = [];

  constructor(
    readonly reservas: ReservaDeLaAgenda[] = [],
    readonly lasCanchas: CanchaDeLaAgenda[] = [CANCHA_1, CANCHA_2],
  ) {}

  canchas(): Promise<CanchaDeLaAgenda[]> {
    return Promise.resolve(this.lasCanchas);
  }

  reservasDelDia(desde: Date, hasta: Date): Promise<ReservaDeLaAgenda[]> {
    this.pedidos.push({ desde, hasta });
    return Promise.resolve(
      this.reservas.filter((r) => r.inicio >= desde && r.inicio < hasta),
    );
  }
}

/** Lo pagado por cada reserva, por id. */
export class PagosDePrueba implements PagosDeReservas {
  constructor(readonly pagos = new Map<number, Monto>()) {}

  pagadoPor(reservaIds: number[]): Promise<Map<number, Monto>> {
    return Promise.resolve(
      new Map([...this.pagos].filter(([id]) => reservaIds.includes(id))),
    );
  }
}
