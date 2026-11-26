import { Injectable } from '@nestjs/common';
import { ConflictoError } from '../../../../compartido/dominio/dominio.error';
import { exclusionViolada } from '../../../../compartido/infraestructura/prisma/exclusion-violada';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { Bloqueo } from '../../dominio/bloqueo.entity';
import type {
  BloqueoDeLaCancha,
  BloqueoRepository,
} from '../../dominio/bloqueo.repository';
import type {
  AccionSobreCancha,
  Autoria,
} from '../../dominio/cancha.repository';
import type { Rango } from '../../dominio/repeticion';

const CON_CANCHA = {
  cancha: { select: { nombre: true } },
} as const satisfies Prisma.BloqueoDeCanchaInclude;

type FilaDelBloqueo = Prisma.BloqueoDeCanchaGetPayload<{
  include: typeof CON_CANCHA;
}>;

const aBloqueo = (fila: FilaDelBloqueo): BloqueoDeLaCancha => ({
  bloqueo: Bloqueo.restaurar(fila.id, {
    canchaId: fila.canchaId,
    tipo: fila.tipo,
    motivo: fila.motivo,
    inicio: fila.inicio,
    fin: fila.fin,
    liberadoEn: fila.liberadoEn,
  }),
  cancha: fila.cancha.nombre,
});

/** Sigue bloqueando después de ese momento: no terminó ni se liberó antes. */
const sinTerminarEn = (ahora: Date): Prisma.BloqueoDeCanchaWhereInput => ({
  OR: [{ liberadoEn: null, fin: { gt: ahora } }, { liberadoEn: { gt: ahora } }],
});

/** Otro bloqueo de la misma cancha pudo guardarse entre la revisión y la escritura. */
function rechazarCruce(error: unknown): never {
  if (exclusionViolada(error, 'bloqueo_de_cancha_sin_cruces_excl'))
    throw new ConflictoError('Ya hay un bloqueo en ese rango.', {});
  throw error;
}

/** Bloqueos sobre PostgreSQL; una restricción de exclusión impide que se pisen. */
@Injectable()
export class PrismaBloqueoRepository implements BloqueoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async chocan(
    canchaIds: number[],
    rangos: Rango[],
  ): Promise<BloqueoDeLaCancha[]> {
    const inicios = rangos.map((r) => r.inicio);
    const fines = rangos.map((r) => r.fin);
    const ids = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT DISTINCT b.id FROM bloqueo_de_cancha b,
        unnest(${inicios}::timestamptz[], ${fines}::timestamptz[]) AS r(inicio, fin)
      WHERE b.cancha_id = ANY(${canchaIds}::int[])
        AND b.inicio < r.fin AND COALESCE(b.liberado_en, b.fin) > r.inicio`;
    const filas = await this.prisma.bloqueoDeCancha.findMany({
      where: { id: { in: ids.map((fila) => fila.id) } },
      include: CON_CANCHA,
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
    return filas.map(aBloqueo);
  }

  registrar(bloqueos: Bloqueo[], autoria: Autoria): Promise<Bloqueo[]> {
    return this.prisma
      .$transaction(async (tx) => {
        const filas = await tx.bloqueoDeCancha.createManyAndReturn({
          data: bloqueos.map((b) => ({
            ...b.ficha,
            creadoPorId: autoria.ejecutadoPorId,
            creadoEn: autoria.ocurridoEn,
          })),
          include: CON_CANCHA,
        });
        const guardados = filas.map(aBloqueo);
        await tx.cambioDeCancha.createMany({
          data: guardados.map((g) => this.cambio(g, 'BLOQUEO', autoria)),
        });
        return guardados.map((g) => g.bloqueo);
      })
      .catch(rechazarCruce);
  }

  async buscar(id: number): Promise<BloqueoDeLaCancha | undefined> {
    const fila = await this.prisma.bloqueoDeCancha.findUnique({
      where: { id },
      include: CON_CANCHA,
    });
    return fila ? aBloqueo(fila) : undefined;
  }

  async liberar(bloqueo: Bloqueo, autoria: Autoria): Promise<void> {
    const fila = await this.prisma.bloqueoDeCancha.update({
      where: { id: bloqueo.id },
      data: { liberadoEn: bloqueo.ficha.liberadoEn },
      include: CON_CANCHA,
    });
    await this.prisma.cambioDeCancha.create({
      data: this.cambio(aBloqueo(fila), 'LIBERACION_DE_BLOQUEO', autoria),
    });
  }

  async quitar(bloqueo: Bloqueo, autoria: Autoria): Promise<void> {
    const encontrado = await this.buscar(bloqueo.id!);
    if (!encontrado) return;
    await this.prisma.$transaction([
      this.prisma.cambioDeCancha.create({
        data: this.cambio(encontrado, 'RETIRO_DE_BLOQUEO', autoria),
      }),
      this.prisma.bloqueoDeCancha.delete({ where: { id: bloqueo.id } }),
    ]);
  }

  async sinTerminar(ahora: Date): Promise<BloqueoDeLaCancha[]> {
    const filas = await this.prisma.bloqueoDeCancha.findMany({
      where: sinTerminarEn(ahora),
      include: CON_CANCHA,
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
    return filas.map(aBloqueo);
  }

  async terminados(ahora: Date, limite: number): Promise<BloqueoDeLaCancha[]> {
    const filas = await this.prisma.bloqueoDeCancha.findMany({
      where: { NOT: sinTerminarEn(ahora) },
      include: CON_CANCHA,
      orderBy: [{ inicio: 'desc' }, { id: 'desc' }],
      take: limite,
    });
    return filas.map(aBloqueo);
  }

  private cambio(
    { bloqueo, cancha }: BloqueoDeLaCancha,
    accion: AccionSobreCancha,
    autoria: Autoria,
  ) {
    return {
      canchaId: bloqueo.ficha.canchaId,
      nombreDeLaCancha: cancha,
      accion,
      detalle: { ...bloqueo.detalle } as Prisma.InputJsonObject,
      ejecutadoPorId: autoria.ejecutadoPorId,
      ocurridoEn: autoria.ocurridoEn,
    };
  }
}
