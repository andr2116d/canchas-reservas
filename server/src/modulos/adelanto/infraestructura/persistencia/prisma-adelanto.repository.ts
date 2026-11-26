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
  AdelantoRepository,
  VersionDelAdelanto,
} from '../../dominio/adelanto.repository';
import { PorcentajeDeAdelanto } from '../../dominio/porcentaje-de-adelanto.value-object';

const CON_QUIEN_LO_GUARDO = {
  guardadoPor: { select: COLUMNAS_DEL_AUTOR },
} as const satisfies Prisma.AdelantoMinimoInclude;

// El más reciente primero; el id desempata dos guardados en el mismo milisegundo.
const MAS_RECIENTE_PRIMERO = [
  { guardadoEn: 'desc' },
  { id: 'desc' },
] as const satisfies Prisma.AdelantoMinimoOrderByWithRelationInput[];

type FilaDelAdelanto = Prisma.AdelantoMinimoGetPayload<{
  include: typeof CON_QUIEN_LO_GUARDO;
}>;

const LIMITE_DEL_HISTORIAL = 20;

/** Versiones del adelanto mínimo sobre PostgreSQL. Solo se agregan; nunca se editan. */
@Injectable()
export class PrismaAdelantoRepository implements AdelantoRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async vigente(): Promise<VersionDelAdelanto | undefined> {
    const fila = await this.prisma.adelantoMinimo.findFirst({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LO_GUARDO,
    });
    return fila ? this.aVersion(fila) : undefined;
  }

  async historial(): Promise<VersionDelAdelanto[]> {
    const filas = await this.prisma.adelantoMinimo.findMany({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LO_GUARDO,
      take: LIMITE_DEL_HISTORIAL,
    });
    return filas.map((fila) => this.aVersion(fila));
  }

  guardarSiCambia(
    porcentaje: PorcentajeDeAdelanto,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelAdelanto }> {
    return this.prisma.$transaction(async (tx) => {
      // Un guardado a la vez: dos iguales al mismo tiempo no se duplican.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('adelanto_minimo'))::text`;
      const actual = await tx.adelantoMinimo.findFirst({
        orderBy: [...MAS_RECIENTE_PRIMERO],
        include: CON_QUIEN_LO_GUARDO,
      });
      if (actual?.porcentaje === porcentaje.valor) {
        return { cambio: false, version: this.aVersion(actual) };
      }
      const creado = await tx.adelantoMinimo.create({
        data: { porcentaje: porcentaje.valor, guardadoPorId, guardadoEn },
        include: CON_QUIEN_LO_GUARDO,
      });
      return { cambio: true, version: this.aVersion(creado) };
    });
  }

  private aVersion(fila: FilaDelAdelanto): VersionDelAdelanto {
    return {
      porcentaje: PorcentajeDeAdelanto.restaurar(fila.porcentaje),
      guardadoEn: fila.guardadoEn,
      guardadoPor: nombreDelAutor(this.cifrador, fila.guardadoPor),
    };
  }
}
