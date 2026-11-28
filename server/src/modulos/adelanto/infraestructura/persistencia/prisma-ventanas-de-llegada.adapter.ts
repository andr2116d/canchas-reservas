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
import type { VentanasDeLlegada } from '../../aplicacion/ventana-de-llegada.use-case';
import {
  type VentanaDeLlegada,
  VENTANA_INICIAL,
} from '../../dominio/ventana-de-llegada';

const MAS_RECIENTE_PRIMERO = [
  { guardadoEn: 'desc' },
  { id: 'desc' },
] satisfies Prisma.VentanaDeLlegadaOrderByWithRelationInput[];

@Injectable()
export class PrismaVentanasDeLlegadaAdapter implements VentanasDeLlegada {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async historial() {
    const filas = await this.prisma.ventanaDeLlegada.findMany({
      orderBy: MAS_RECIENTE_PRIMERO,
      include: { guardadoPor: { select: COLUMNAS_DEL_AUTOR } },
      take: 20,
    });
    return filas.map(
      ({ minutosAntes, minutosDespues, guardadoEn, guardadoPor }) => ({
        minutosAntes,
        minutosDespues,
        guardadaEn: guardadoEn,
        guardadaPor: nombreDelAutor(this.cifrador, guardadoPor),
      }),
    );
  }

  guardar(
    datos: VentanaDeLlegada,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('ventana_de_llegada'))::text`;
      const anterior =
        (await tx.ventanaDeLlegada.findFirst({
          orderBy: MAS_RECIENTE_PRIMERO,
        })) ?? VENTANA_INICIAL;
      if (
        datos.minutosAntes === anterior.minutosAntes &&
        datos.minutosDespues === anterior.minutosDespues
      )
        return false;
      await tx.ventanaDeLlegada.create({
        data: { ...datos, guardadoEn, guardadoPorId },
      });
      return true;
    });
  }
}
