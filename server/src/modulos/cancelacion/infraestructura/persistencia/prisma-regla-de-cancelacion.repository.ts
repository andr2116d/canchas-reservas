import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { ReglaDeCancelacion } from '../../dominio/regla-de-cancelacion';
import type {
  ReglaDeCancelacionRepository,
  VersionDeLaRegla,
} from '../../dominio/regla-de-cancelacion.repository';

const COMPLETA = {
  rangos: true,
  guardadaPor: { select: { nombresCifrado: true, apellidosCifrado: true } },
} as const satisfies Prisma.ReglaDeCancelacionInclude;

// La más reciente primero; el id desempata dos guardados en el mismo milisegundo.
const MAS_RECIENTE_PRIMERO = [
  { guardadaEn: 'desc' },
  { id: 'desc' },
] as const satisfies Prisma.ReglaDeCancelacionOrderByWithRelationInput[];

type FilaDeLaRegla = Prisma.ReglaDeCancelacionGetPayload<{
  include: typeof COMPLETA;
}>;

const LIMITE_DEL_HISTORIAL = 20;

/** Versiones de la regla de cancelación sobre PostgreSQL. Solo se agregan; nunca se editan. */
@Injectable()
export class PrismaReglaDeCancelacionRepository implements ReglaDeCancelacionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async vigente(): Promise<VersionDeLaRegla | undefined> {
    const fila = await this.prisma.reglaDeCancelacion.findFirst({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: COMPLETA,
    });
    return fila ? this.aVersion(fila) : undefined;
  }

  async historial(): Promise<VersionDeLaRegla[]> {
    const filas = await this.prisma.reglaDeCancelacion.findMany({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: COMPLETA,
      take: LIMITE_DEL_HISTORIAL,
    });
    return filas.map((fila) => this.aVersion(fila));
  }

  guardarSiCambia(
    regla: ReglaDeCancelacion,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeLaRegla }> {
    return this.prisma.$transaction(async (tx) => {
      // Un guardado a la vez: dos iguales al mismo tiempo no se duplican.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('regla_de_cancelacion'))::text`;
      const actual = await tx.reglaDeCancelacion.findFirst({
        orderBy: [...MAS_RECIENTE_PRIMERO],
        include: COMPLETA,
      });
      if (actual && this.aVersion(actual).regla.igualA(regla)) {
        return { cambio: false, version: this.aVersion(actual) };
      }
      const creada = await tx.reglaDeCancelacion.create({
        data: {
          guardadaPorId,
          guardadaEn,
          rangos: { create: [...regla.rangos] },
        },
        include: COMPLETA,
      });
      return { cambio: true, version: this.aVersion(creada) };
    });
  }

  private aVersion(fila: FilaDeLaRegla): VersionDeLaRegla {
    const { nombresCifrado, apellidosCifrado } = fila.guardadaPor;
    return {
      regla: ReglaDeCancelacion.restaurar(
        fila.rangos.map(({ desdeHoras, porcentaje, ofreceCredito }) => ({
          desdeHoras,
          porcentaje,
          ofreceCredito,
        })),
      ),
      guardadaEn: fila.guardadaEn,
      guardadaPor: [nombresCifrado, apellidosCifrado]
        .map((valor) => this.cifrador.descifrar(valor))
        .join(' '),
    };
  }
}
