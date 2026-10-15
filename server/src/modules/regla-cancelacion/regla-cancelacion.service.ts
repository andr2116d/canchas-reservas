import { Injectable } from '@nestjs/common';
import { instanteEnLima } from '../../common/fechas-lima';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ActualizarReglaCancelacionDto } from './dto/actualizar-regla-cancelacion.dto';

const ID_REGLA = 1;
const MS_POR_HORA = 60 * 60 * 1000;

type Cliente = Prisma.TransactionClient | PrismaService;

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

  plazoLimite(fecha: string, horaInicio: string, horasAnticipacion: number) {
    return new Date(
      instanteEnLima(fecha, horaInicio).getTime() -
        horasAnticipacion * MS_POR_HORA,
    );
  }
}
