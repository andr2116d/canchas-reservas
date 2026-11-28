import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  fechaEnLima,
  horaEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import {
  type PlazoDeCancelacion,
  ReglaDeCancelacion,
} from '../../cancelacion/api-cancelacion';
import { esCodigoDeReserva } from '../dominio/codigo-de-reserva';
import { estadoALaVista, horaDeFin } from '../dominio/reserva-a-la-vista';
import { ReservaNoEncontradaError } from '../dominio/reserva-no-encontrada.error';
import type {
  EstadoDeReserva,
  ReservaGuardada,
  ReservaRepository,
} from '../dominio/reserva.repository';

/** Una reserva como la ve su titular, con la hora del server para medir cuánto falta. */
export interface VistaDeMiReserva {
  codigo: string;
  estado: EstadoDeReserva;
  cancha: ReservaGuardada['cancha'];
  fecha: string;
  desde: string;
  hasta: string;
  inicio: Date;
  precio: string;
  adelanto: string;
  porcentajeDeAdelanto: number;
  venceEn: Date | null;
  ahora: Date;
  plazos: PlazoDeCancelacion[];
  adicionales: { nombre: string; precio: string }[];
}

/** La reserva de su titular; la de otra persona responde como si no existiera. */
export class ConsultarMiReservaUseCase {
  constructor(
    private readonly reservas: Pick<ReservaRepository, 'delTitular'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(titularId: number, codigo: string): Promise<VistaDeMiReserva> {
    const reserva = esCodigoDeReserva(codigo)
      ? await this.reservas.delTitular(titularId, codigo)
      : undefined;
    if (!reserva) throw new ReservaNoEncontradaError();
    const ahora = this.reloj.ahora();
    return {
      codigo: reserva.codigo,
      estado: estadoALaVista(reserva, ahora),
      cancha: reserva.cancha,
      fecha: fechaEnLima(reserva.inicio),
      desde: horaEnLima(reserva.inicio),
      hasta: horaDeFin(reserva),
      inicio: reserva.inicio,
      precio: reserva.precio.enSoles(),
      adelanto: reserva.adelanto.enSoles(),
      porcentajeDeAdelanto: reserva.porcentajeDeAdelanto,
      venceEn: reserva.canal === 'RECEPCION' ? null : reserva.venceEn,
      ahora,
      plazos: ReglaDeCancelacion.restaurar(reserva.rangos).plazosPara(
        reserva.inicio,
        ahora,
      ),
      adicionales: reserva.adicionales.map(({ nombre, precio }) => ({
        nombre,
        precio: precio.enSoles(),
      })),
    };
  }
}
