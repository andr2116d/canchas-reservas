import type { Monto } from '../../../compartido/dominio/monto.value-object';

export const PAGOS_DE_RESERVAS = Symbol('PAGOS_DE_RESERVAS');

/** Cuánto se pagó por cada reserva. */
export interface PagosDeReservas {
  /** Lo pagado por cada reserva que tiene pagos, por id; las que no aparecen no pagaron nada. */
  pagadoPor(reservaIds: number[]): Promise<Map<number, Monto>>;
}
