import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { DIAS_DE_LA_SEMANA } from '../../dominio/dia-de-la-semana';
import type {
  HorarioRepository,
  VersionDeHorario,
} from '../../dominio/horario.repository';
import { HorarioDelDia } from '../../dominio/horario-del-dia';
import { HorarioSemanal } from '../../dominio/horario-semanal';

const COMPLETO = {
  dias: true,
  guardadoPor: { select: COLUMNAS_DEL_AUTOR },
} as const satisfies Prisma.HorarioDeAtencionInclude;

// El más reciente primero; el id desempata dos guardados en el mismo milisegundo.
const MAS_RECIENTE_PRIMERO = [
  { guardadoEn: 'desc' },
  { id: 'desc' },
] as const satisfies Prisma.HorarioDeAtencionOrderByWithRelationInput[];

type FilaDeHorario = Prisma.HorarioDeAtencionGetPayload<{
  include: typeof COMPLETO;
}>;

const LIMITE_DEL_HISTORIAL = 20;

/** Versiones del horario de atención sobre PostgreSQL. Solo se agregan; nunca se editan. */
@Injectable()
export class PrismaHorarioRepository implements HorarioRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async vigente(): Promise<VersionDeHorario | undefined> {
    const fila = await this.prisma.horarioDeAtencion.findFirst({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: COMPLETO,
    });
    return fila ? this.aVersion(fila) : undefined;
  }

  async historial(): Promise<VersionDeHorario[]> {
    const filas = await this.prisma.horarioDeAtencion.findMany({
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: COMPLETO,
      take: LIMITE_DEL_HISTORIAL,
    });
    return filas.map((fila) => this.aVersion(fila));
  }

  guardarSiCambia(
    horario: HorarioSemanal,
    guardadoPorId: number,
    guardadoEn: Date,
    reservasFueraDeHorario: string[],
  ): Promise<{ cambio: boolean; version: VersionDeHorario }> {
    return this.prisma.$transaction(async (tx) => {
      // Un guardado a la vez: dos iguales al mismo tiempo no se duplican.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('horario_de_atencion'))::text`;
      const actual = await tx.horarioDeAtencion.findFirst({
        orderBy: [...MAS_RECIENTE_PRIMERO],
        include: COMPLETO,
      });
      if (actual && this.aVersion(actual).horario.igualA(horario)) {
        return { cambio: false, version: this.aVersion(actual) };
      }
      const creado = await tx.horarioDeAtencion.create({
        data: {
          minutoDeInicioDeLaNoche: horario.inicioDeLaNoche.minutos,
          guardadoPorId,
          guardadoEn,
          reservasFueraDeHorario,
          dias: { create: this.filasDeLosDias(horario) },
        },
        include: COMPLETO,
      });
      return { cambio: true, version: this.aVersion(creado) };
    });
  }

  private filasDeLosDias(horario: HorarioSemanal) {
    return DIAS_DE_LA_SEMANA.flatMap((dia) => {
      const delDia = horario.del(dia);
      if (!delDia) return [];
      return [
        {
          dia,
          minutoDeApertura: delDia.abre.minutos,
          minutoDeCierre: delDia.cierra.minutos,
          minutoDeInicioDeLaNoche: delDia.inicioDeLaNoche?.minutos ?? null,
        },
      ];
    });
  }

  private aVersion(fila: FilaDeHorario): VersionDeHorario {
    const dias = new Map(
      fila.dias.map((dia) => [
        dia.dia,
        HorarioDelDia.restaurar(
          dia.minutoDeApertura,
          dia.minutoDeCierre,
          dia.minutoDeInicioDeLaNoche ?? undefined,
        ),
      ]),
    );
    return {
      horario: HorarioSemanal.restaurar(fila.minutoDeInicioDeLaNoche, dias),
      guardadoEn: fila.guardadoEn,
      guardadoPor: nombreDelAutor(this.cifrador, fila.guardadoPor),
    };
  }
}
