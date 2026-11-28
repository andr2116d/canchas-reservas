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
import { MinutosParaPagar } from '../../dominio/minutos-para-pagar.value-object';
import type {
  PlazoDePagoRepository,
  VersionDelPlazo,
} from '../../dominio/plazo-de-pago.repository';

const CON_QUIEN_LO_GUARDO = {
  guardadoPor: { select: COLUMNAS_DEL_AUTOR },
} as const satisfies Prisma.PlazoDePagoInclude;

// El más reciente primero; el id desempata dos guardados en el mismo milisegundo.
const MAS_RECIENTE_PRIMERO = [
  { guardadoEn: 'desc' },
  { id: 'desc' },
] as const satisfies Prisma.PlazoDePagoOrderByWithRelationInput[];

type FilaDelPlazo = Prisma.PlazoDePagoGetPayload<{
  include: typeof CON_QUIEN_LO_GUARDO;
}>;

const LIMITE_DEL_HISTORIAL = 20;

/** Versiones del plazo para pagar sobre PostgreSQL. Solo se agregan; nunca se editan. */
@Injectable()
export class PrismaPlazoDePagoRepository implements PlazoDePagoRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async vigente(): Promise<VersionDelPlazo | undefined> {
    const fila = await this.prisma.plazoDePago.findFirst({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LO_GUARDO,
    });
    return fila ? this.aVersion(fila) : undefined;
  }

  async historial(): Promise<VersionDelPlazo[]> {
    const filas = await this.prisma.plazoDePago.findMany({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LO_GUARDO,
      take: LIMITE_DEL_HISTORIAL,
    });
    return filas.map((fila) => this.aVersion(fila));
  }

  guardarSiCambia(
    minutos: MinutosParaPagar,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelPlazo }> {
    return this.prisma.$transaction(async (tx) => {
      // Un guardado a la vez: dos iguales al mismo tiempo no se duplican.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('plazo_de_pago'))::text`;
      const actual = await tx.plazoDePago.findFirst({
        orderBy: [...MAS_RECIENTE_PRIMERO],
        include: CON_QUIEN_LO_GUARDO,
      });
      if (actual?.minutos === minutos.valor) {
        return { cambio: false, version: this.aVersion(actual) };
      }
      const creado = await tx.plazoDePago.create({
        data: { minutos: minutos.valor, guardadoPorId, guardadoEn },
        include: CON_QUIEN_LO_GUARDO,
      });
      return { cambio: true, version: this.aVersion(creado) };
    });
  }

  private aVersion(fila: FilaDelPlazo): VersionDelPlazo {
    return {
      minutos: MinutosParaPagar.restaurar(fila.minutos),
      guardadoEn: fila.guardadoEn,
      guardadoPor: nombreDelAutor(this.cifrador, fila.guardadoPor),
    };
  }
}
