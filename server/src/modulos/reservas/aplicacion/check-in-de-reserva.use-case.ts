import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../../compartido/aplicacion/reloj.port';
import { ConflictoError } from '../../../compartido/dominio/dominio.error';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import {
  fechaEnLima,
  horaEnLima,
} from '../../../compartido/dominio/momento-en-lima';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import {
  limitesDeLlegada,
  type VentanaDeLlegada,
} from '../../adelanto/api-adelanto';
import {
  type CobroDeReserva,
  type CobroSolicitado,
  validarCobro,
} from '../dominio/cobro-de-reserva';
import { esCodigoDeReserva } from '../dominio/codigo-de-reserva';
import { estadoALaVista } from '../dominio/reserva-a-la-vista';
import { ReservaNoEncontradaError } from '../dominio/reserva-no-encontrada.error';
import type { EstadoDeReserva } from '../dominio/reserva.repository';

export const REGISTRO_DE_CHECK_IN = Symbol('REGISTRO_DE_CHECK_IN');

export interface ReservaParaCheckIn {
  codigo: string;
  estado: EstadoDeReserva;
  inicio: Date;
  venceEn: Date | null;
  precio: Monto;
  pagado: Monto;
  checkInEn: Date | null;
  ventana: VentanaDeLlegada | null;
}

export type DetalleDelCheckIn =
  | {
      tipo: 'listo';
      codigo: string;
      precio: string;
      pagado: string;
      saldo: string;
    }
  | { tipo: 'ya-realizado'; codigo: string; checkInEn: Date };

export type ResultadoDelCheckIn =
  | { tipo: 'realizado'; codigo: string; checkInEn: Date }
  | Extract<DetalleDelCheckIn, { tipo: 'ya-realizado' }>;

type Cobrar = (
  reserva: ReservaParaCheckIn,
) =>
  | CobroDeReserva
  | Extract<DetalleDelCheckIn, { tipo: 'ya-realizado' }>
  | undefined;

export interface RegistroDeCheckIn {
  buscar(codigo: string): Promise<ReservaParaCheckIn | undefined>;
  registrar(
    codigo: string,
    recepcionistaId: number,
    checkInEn: Date,
    decidirCobro: Cobrar,
  ): Promise<ResultadoDelCheckIn>;
}

const ESTADO: Record<EstadoDeReserva, string> = {
  PENDIENTE_DE_PAGO: 'pendiente de pago',
  PENDIENTE_DE_VALIDACION: 'pendiente de validación',
  CONFIRMADA: 'confirmada',
  EN_JUEGO: 'en juego',
  EXPIRADA: 'expirada',
  CANCELADA: 'cancelada',
  AUSENTE: 'ausente',
  FINALIZADA: 'finalizada',
};

function preparar(reserva: ReservaParaCheckIn, ahora: Date): DetalleDelCheckIn {
  const estado = estadoALaVista(reserva, ahora);
  if (estado === 'EN_JUEGO' && reserva.checkInEn) {
    return {
      tipo: 'ya-realizado',
      codigo: reserva.codigo,
      checkInEn: reserva.checkInEn,
    };
  }
  if (estado !== 'CONFIRMADA')
    throw new ConflictoError(
      `La reserva está ${ESTADO[estado]}. Solo se puede hacer check-in de una reserva confirmada.`,
      {},
    );
  if (fechaEnLima(reserva.inicio) !== fechaEnLima(ahora)) {
    throw new ConflictoError(
      'Solo se puede hacer check-in de reservas de hoy, en la hora de Lima.',
      {},
    );
  }
  const { desde, hasta } = limitesDeLlegada(
    reserva.inicio,
    reserva.ventana ?? undefined,
  );
  if (ahora < desde)
    throw new ConflictoError(
      `El check-in se puede hacer desde las ${horaEnLima(desde)}.`,
      {},
    );
  if (ahora > hasta)
    throw new ConflictoError(
      `La ventana de check-in fue de ${horaEnLima(desde)} a ${horaEnLima(hasta)} y ya terminó.`,
      {},
    );
  return {
    tipo: 'listo',
    codigo: reserva.codigo,
    precio: reserva.precio.enSoles(),
    pagado: reserva.pagado.enSoles(),
    saldo: Monto.desdeCentimos(
      Math.max(0, reserva.precio.centimos - reserva.pagado.centimos),
    ).enSoles(),
  };
}

@Injectable()
export class CheckInDeReservaUseCase {
  constructor(
    @Inject(REGISTRO_DE_CHECK_IN) private readonly registro: RegistroDeCheckIn,
    @Inject(RELOJ) private readonly reloj: Reloj,
  ) {}

  async consultar(codigo: string): Promise<DetalleDelCheckIn> {
    const reserva = esCodigoDeReserva(codigo)
      ? await this.registro.buscar(codigo)
      : undefined;
    if (!reserva) throw new ReservaNoEncontradaError();
    return preparar(reserva, this.reloj.ahora());
  }

  ejecutar(
    codigo: string,
    recepcionistaId: number,
    datos: CobroSolicitado,
  ): Promise<ResultadoDelCheckIn> {
    if (!esCodigoDeReserva(codigo)) throw new ReservaNoEncontradaError();
    const ahora = this.reloj.ahora();
    return this.registro.registrar(
      codigo,
      recepcionistaId,
      ahora,
      (reserva) => {
        const detalle = preparar(reserva, ahora);
        if (detalle.tipo === 'ya-realizado') return detalle;
        if (detalle.saldo === '0.00') return undefined;
        const saldo = Monto.crear(detalle.saldo);
        return validarCobro(datos, (monto) => {
          if (monto.centimos < saldo.centimos) {
            const falta = Monto.desdeCentimos(
              saldo.centimos - monto.centimos,
            ).enSoles();
            throw new ValorInvalidoError(`Falta cobrar S/ ${falta}.`);
          }
          if (monto.centimos > saldo.centimos) {
            throw new ValorInvalidoError(
              `Corrige el monto. El saldo es S/ ${saldo.enSoles()}.`,
            );
          }
        });
      },
    );
  }
}
