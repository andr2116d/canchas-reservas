import type { EstadoQueOcupa } from '../../../compartido/dominio/reserva-que-ocupa';
import type { Monto } from '../../../compartido/dominio/monto.value-object';
import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';
import type { RangoDeCancelacion } from '../../cancelacion/api-cancelacion';
import type { CobroDeReserva } from './cobro-de-reserva';

export const RESERVA_REPOSITORY = Symbol('RESERVA_REPOSITORY');

export type EstadoDeReserva =
  EstadoQueOcupa | 'EXPIRADA' | 'CANCELADA' | 'AUSENTE' | 'FINALIZADA';

/** Una reserva por guardar, con los montos y la regla de su momento. */
export interface ReservaNueva {
  codigo: string;
  canchaId: number;
  titularId: number;
  creadaPorId: number;
  inicio: Date;
  fin: Date;
  precio: Monto;
  porcentajeDeAdelanto: number;
  adelanto: Monto;
  reglaDeCancelacionId: number;
  canal: 'WEB' | 'RECEPCION';
  creadaEn: Date;
  venceEn: Date | null;
  cobro?: CobroDeReserva;
  adicionalIds: number[];
}

/** Una reserva guardada, con lo que su titular necesita ver. */
export interface ReservaGuardada {
  codigo: string;
  estado: EstadoDeReserva;
  cancha: { nombre: string; tipo: TipoDeCancha; tieneIluminacion: boolean };
  inicio: Date;
  fin: Date;
  precio: Monto;
  porcentajeDeAdelanto: number;
  adelanto: Monto;
  venceEn: Date | null;
  canal?: ReservaNueva['canal'];
  creadaEn: Date;
  /** Los rangos de la regla de cancelación que regía al crearla. */
  rangos: RangoDeCancelacion[];
  adicionales: { nombre: string; precio: Monto }[];
}

/** Una reserva que pasó a expirada por vencer sin pago: a su titular se le avisa. */
export interface ReservaExpirada {
  codigo: string;
  titularId: number;
}

/** Puerto de las reservas. */
export interface ReservaRepository {
  /**
   * Guarda la reserva en una operación: expira las vencidas que estorban y respeta el
   * máximo de pendientes de pago. Devuelve las que expiró. Lanza TurnoNoDisponibleError,
   * LimiteDePendientesError o CodigoRepetidoError.
   */
  crear(
    reserva: ReservaNueva,
    maximoDePendientes: number,
  ): Promise<ReservaExpirada[]>;

  /** Pasa a expiradas las pendientes de pago que vencieron hasta `ahora` y las devuelve. */
  expirarVencidas(ahora: Date): Promise<ReservaExpirada[]>;

  /** Solo si la reserva es de esa persona. */
  delTitular(
    titularId: number,
    codigo: string,
  ): Promise<ReservaGuardada | undefined>;
}
