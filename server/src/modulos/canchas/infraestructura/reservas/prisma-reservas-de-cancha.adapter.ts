import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type {
  ConsultaDeReservas,
  ReservaAfectada,
  ReservasDeCancha,
} from '../../aplicacion/reservas-de-cancha.port';

const CON_TITULAR = {
  titular: { select: COLUMNAS_DEL_AUTOR },
} as const satisfies Prisma.ReservaInclude;

type FilaDeReserva = Prisma.ReservaGetPayload<{ include: typeof CON_TITULAR }>;

/** Las reservas guardadas, vistas desde lo que el módulo de canchas necesita saber. */
@Injectable()
export class PrismaReservasDeCanchaAdapter implements ReservasDeCancha {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async porJugar(canchaId: number, desde: Date): Promise<ReservaAfectada[]> {
    const filas = await this.prisma.reserva.findMany({
      where: { canchaId, fin: { gt: desde } },
      orderBy: { inicio: 'asc' },
      include: CON_TITULAR,
    });
    return filas.map((fila) => this.aAfectada(fila));
  }

  async enRangos(
    consultas: ConsultaDeReservas[],
  ): Promise<(ReservaAfectada & { canchaId: number })[]> {
    if (consultas.length === 0) return [];
    const filas = await this.prisma.reserva.findMany({
      where: {
        OR: consultas.map(({ canchaId, inicio, fin }) => ({
          canchaId,
          inicio: { lt: fin },
          fin: { gt: inicio },
        })),
      },
      orderBy: [{ inicio: 'asc' }, { canchaId: 'asc' }],
      include: CON_TITULAR,
    });
    return filas.map((fila) => ({
      ...this.aAfectada(fila),
      canchaId: fila.canchaId,
    }));
  }

  async conReservas(canchaIds: number[]): Promise<Set<number>> {
    const filas = await this.prisma.reserva.findMany({
      where: { canchaId: { in: canchaIds } },
      distinct: ['canchaId'],
      select: { canchaId: true },
    });
    return new Set(filas.map((fila) => fila.canchaId));
  }

  private aAfectada(fila: FilaDeReserva): ReservaAfectada {
    return {
      inicio: fila.inicio,
      fin: fila.fin,
      titular: nombreDelAutor(this.cifrador, fila.titular),
    };
  }
}
