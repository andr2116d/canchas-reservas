import type { Monto } from '../../../compartido/dominio/monto.value-object';
import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';
import type { EstadoDeReserva } from '../dominio/reserva.repository';
import type { VentanaDeLlegada } from '../../adelanto/api-adelanto';

export const AGENDA_DEL_LOCAL = Symbol('AGENDA_DEL_LOCAL');

export interface CanchaDeLaAgenda {
  id: number;
  nombre: string;
  tipo: TipoDeCancha;
}

/** Una reserva como la necesita recepción: con el nombre y el celular del titular descifrados. */
export interface ReservaDeLaAgenda {
  id: number;
  codigo: string;
  estado: EstadoDeReserva;
  inicio: Date;
  fin: Date;
  venceEn: Date | null;
  ventanaDeLlegada?: VentanaDeLlegada | null;
  cancha: CanchaDeLaAgenda;
  precio: Monto;
  adelanto: Monto;
  cliente: { nombre: string; celular: string | null };
}

/** Lo que la agenda lee del local. */
export interface AgendaDelLocal {
  /** Todas las canchas que existen, también las desactivadas: pueden tener reservas pasadas. */
  canchas(): Promise<CanchaDeLaAgenda[]>;

  /** Las reservas que empiezan desde `desde` y antes de `hasta`, en cualquier estado. */
  reservasDelDia(desde: Date, hasta: Date): Promise<ReservaDeLaAgenda[]>;
}
