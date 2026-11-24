import type { Cancha, FichaDeCancha } from '../dominio/cancha.entity';
import type {
  AccionSobreCancha,
  CambioRegistrado,
} from '../dominio/cancha.repository';
import type { ReservaAfectada } from './reservas-de-cancha.port';

/** Una cancha como la ve administración. */
export interface VistaDeCancha extends FichaDeCancha {
  id: number;
  /** Solo si nunca tuvo reservas; si tuvo, se desactiva. */
  sePuedeEliminar: boolean;
}

export interface VistaDeCambio {
  accion: AccionSobreCancha;
  nombreDeLaCancha: string;
  ejecutadoPor: string;
  ocurridoEn: string;
  detalle: CambioRegistrado['detalle'];
}

export interface VistaDeReserva {
  inicio: string;
  fin: string;
  titular: string;
}

export function aVista(
  cancha: Cancha,
  sePuedeEliminar: boolean,
): VistaDeCancha {
  return { id: cancha.id!, ...cancha.ficha, sePuedeEliminar };
}

export function aVistaDeCambio(cambio: CambioRegistrado): VistaDeCambio {
  return { ...cambio, ocurridoEn: cambio.ocurridoEn.toISOString() };
}

export function aVistaDeReserva(reserva: ReservaAfectada): VistaDeReserva {
  return {
    inicio: reserva.inicio.toISOString(),
    fin: reserva.fin.toISOString(),
    titular: reserva.titular,
  };
}
