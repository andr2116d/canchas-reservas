import { Injectable } from '@nestjs/common';
import { instanteEnLima } from '../../common/fechas-lima';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ID_REGLA = 1;
const MS_POR_HORA = 60 * 60 * 1000;

type Cliente = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ReglaCancelacionService {
  constructor(private readonly prisma: PrismaService) {}

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
