import { Injectable } from '@nestjs/common';
import { instanteEnLima } from '../../common/fechas-lima';
import type { Prisma, Reserva } from '../../generated/prisma/client';
import type { MotivoCancelacion } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { calcularMontosReserva } from '../reservas/montos-reserva';
import { calcularCompensacion } from './calculo-compensacion';
import { ActualizarReglaCancelacionDto } from './dto/actualizar-regla-cancelacion.dto';

const ID_REGLA = 1;
const MS_POR_HORA = 60 * 60 * 1000;

type Cliente = Prisma.TransactionClient | PrismaService;

type ReservaACompensar = Pick<
  Reserva,
  | 'id'
  | 'inicioEn'
  | 'valorTurno'
  | 'reglaHorasAnticipacion'
  | 'reglaTipoCompensacion'
>;

@Injectable()
export class ReglaCancelacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  actualizar(dto: ActualizarReglaCancelacionDto, usuarioId: number) {
    return this.prisma.$transaction(async (tx) => {
      // Serializa los cambios antes de leer el estado que quedará en auditoría.
      await tx.$queryRaw`
        SELECT id FROM regla_cancelacion WHERE id = ${ID_REGLA} FOR UPDATE
      `;
      const vigente = await this.obtenerVigente(tx);
      const anterior = {
        horasAnticipacion: vigente.horasAnticipacion,
        tipoCompensacion: vigente.tipoCompensacion,
      };
      const actualizada = await tx.reglaCancelacion.update({
        where: { id: ID_REGLA },
        data: {
          horasAnticipacion: dto.horasAnticipacion,
          tipoCompensacion: dto.tipoCompensacion,
        },
      });
      const nuevo = {
        horasAnticipacion: actualizada.horasAnticipacion,
        tipoCompensacion: actualizada.tipoCompensacion,
      };
      await this.auditoria.registrar(
        {
          accion: 'EDITAR',
          entidad: 'REGLA_CANCELACION',
          entidadId: ID_REGLA,
          usuarioId,
          detalle: { anterior, nuevo },
        },
        tx,
      );
      return nuevo;
    });
  }

  obtenerVigente(cliente: Cliente = this.prisma) {
    return cliente.reglaCancelacion.findUniqueOrThrow({
      where: { id: ID_REGLA },
    });
  }

  async calcularCompensacion(
    reserva: ReservaACompensar,
    momento: Date,
    motivo: MotivoCancelacion,
    cliente: Cliente = this.prisma,
  ) {
    const pagos = await cliente.pago.findMany({
      where: { reservaId: reserva.id, estado: 'APROBADO' },
      select: { concepto: true, monto: true },
    });
    const { adelantoPagado, pagadoTurno } = calcularMontosReserva(
      reserva.valorTurno,
      pagos,
    );
    return calcularCompensacion({
      inicioEn: reserva.inicioEn,
      horasAnticipacion: reserva.reglaHorasAnticipacion,
      tipoCompensacion: reserva.reglaTipoCompensacion,
      adelantoPagado,
      pagadoTurno,
      momento,
      motivo,
    });
  }

  plazoLimite(fecha: string, horaInicio: string, horasAnticipacion: number) {
    return new Date(
      instanteEnLima(fecha, horaInicio).getTime() -
        horasAnticipacion * MS_POR_HORA,
    );
  }
}
