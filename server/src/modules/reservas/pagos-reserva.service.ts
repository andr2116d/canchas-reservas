import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import { Reloj } from '../../common/reloj/reloj';
import type { Prisma } from '../../generated/prisma/client';
import type { EstadoReserva } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { aCentimos, aNumero, deCentimos } from '../tarifas/calculo-tarifa';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto';
import { calcularMontosReserva } from './montos-reserva';
import { pagosAprobadosPorReserva } from './pagos-aprobados';

export const ESTADOS_POR_CONFIRMAR: EstadoReserva[] = [
  'PENDIENTE_PAGO',
  'PENDIENTE_VALIDACION',
];

export const MENSAJES_PAGO = {
  noEncontrada: 'No se encontró la reserva',
  estadoNoPermite:
    'Solo se puede confirmar el pago de una reserva pendiente de pago',
  turnoTerminado: 'El turno de esta reserva ya terminó',
} as const;

const ENTIDAD = 'RESERVA';
const ACCION = 'CONFIRMAR_PAGO';
const OPCIONES_TRANSACCION = { maxWait: 15000, timeout: 15000 };

function conflicto(mensaje: string) {
  return new ConflictException(cuerpoError(409, mensaje));
}

@Injectable()
export class PagosReservaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: Reloj,
    private readonly auditoria: AuditoriaService,
    private readonly gateway: TurnosGateway,
  ) {}

  async confirmar(
    reservaId: number,
    datos: ConfirmarPagoDto,
    usuarioId: number,
  ) {
    const { fecha, canchaId, ...confirmada } = await this.prisma.$transaction(
      (tx) => this.confirmarEn(tx, reservaId, datos, usuarioId),
      OPCIONES_TRANSACCION,
    );
    this.gateway.notificar(fecha, canchaId);
    return confirmada;
  }

  private async confirmarEn(
    tx: Prisma.TransactionClient,
    reservaId: number,
    { metodo, pagoCompleto, numeroOperacion }: ConfirmarPagoDto,
    usuarioId: number,
  ) {
    await tx.$queryRaw`SELECT id FROM reserva WHERE id = ${reservaId} FOR UPDATE`;
    const reserva = await tx.reserva.findUnique({
      where: { id: reservaId },
      select: {
        id: true,
        codigo: true,
        estado: true,
        fecha: true,
        canchaId: true,
        finEn: true,
        valorTurno: true,
        adelantoMinimo: true,
      },
    });
    if (!reserva) {
      throw new NotFoundException(
        cuerpoError(404, MENSAJES_PAGO.noEncontrada),
      );
    }
    if (!ESTADOS_POR_CONFIRMAR.includes(reserva.estado)) {
      throw conflicto(MENSAJES_PAGO.estadoNoPermite);
    }
    const ahora = this.reloj.ahora();
    if (reserva.finEn <= ahora) {
      throw conflicto(MENSAJES_PAGO.turnoTerminado);
    }

    const pagos = await pagosAprobadosPorReserva(tx, [reserva.id]);
    const antes = calcularMontosReserva(
      reserva.valorTurno,
      pagos.get(reserva.id) ?? [],
    );
    const faltaAdelanto = Math.max(
      aCentimos(reserva.adelantoMinimo) - aCentimos(antes.adelantoPagado),
      0,
    );
    const saldo = pagoCompleto
      ? Math.max(aCentimos(antes.saldoPendiente) - faltaAdelanto, 0)
      : 0;
    const comunes = {
      reservaId: reserva.id,
      canal: 'RECEPCION',
      metodo,
      estado: 'APROBADO',
      numeroOperacion: numeroOperacion ?? null,
      registradoPorId: usuarioId,
      validadoPorId: usuarioId,
      validadoEn: ahora,
      creadoEn: ahora,
    } as const;
    if (faltaAdelanto > 0) {
      await tx.pago.create({
        data: {
          ...comunes,
          concepto: 'ADELANTO',
          monto: deCentimos(faltaAdelanto),
        },
      });
    }
    if (saldo > 0) {
      await tx.pago.create({
        data: { ...comunes, concepto: 'SALDO', monto: deCentimos(saldo) },
      });
    }

    await tx.reserva.update({
      where: { id: reserva.id },
      data: { estado: 'CONFIRMADA', confirmadaEn: ahora, venceEn: null },
    });
    await this.auditoria.registrar(
      {
        usuarioId,
        accion: ACCION,
        entidad: ENTIDAD,
        entidadId: reserva.id,
        detalle: {
          codigo: reserva.codigo,
          anterior: { estado: reserva.estado },
          nuevo: { estado: 'CONFIRMADA' },
          metodo,
          monto: aNumero(deCentimos(faltaAdelanto + saldo)),
          ...(numeroOperacion ? { numeroOperacion } : {}),
        },
      },
      tx,
    );

    const pagado = aCentimos(antes.adelantoPagado) + faltaAdelanto;
    return {
      fecha: reserva.fecha.toISOString().slice(0, 10),
      canchaId: reserva.canchaId,
      id: reserva.id,
      codigo: reserva.codigo,
      estado: 'CONFIRMADA' as const,
      adelantoPagado: aNumero(deCentimos(pagado)),
      saldoPendiente: aNumero(
        deCentimos(
          Math.max(aCentimos(antes.saldoPendiente) - faltaAdelanto - saldo, 0),
        ),
      ),
    };
  }
}
