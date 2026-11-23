import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { DuracionDelTurno } from '../../dominio/duracion-del-turno.value-object';
import { Monto } from '../../dominio/monto.value-object';
import { Tarifa } from '../../dominio/tarifa';
import type {
  TarifaRepository,
  VersionDeTarifa,
} from '../../dominio/tarifa.repository';
import type { TipoDeCancha } from '../../dominio/tipo-de-cancha';

const CON_QUIEN_LA_GUARDO = {
  guardadaPor: { select: { nombresCifrado: true, apellidosCifrado: true } },
} as const satisfies Prisma.TarifaDeCanchaInclude;

// La más reciente primero; el id desempata dos guardados en el mismo milisegundo.
const MAS_RECIENTE_PRIMERO = [
  { guardadaEn: 'desc' },
  { id: 'desc' },
] as const satisfies Prisma.TarifaDeCanchaOrderByWithRelationInput[];

type FilaDeTarifa = Prisma.TarifaDeCanchaGetPayload<{
  include: typeof CON_QUIEN_LA_GUARDO;
}>;

const LIMITE_DEL_HISTORIAL = 20;

/** Versiones de tarifas sobre PostgreSQL. Solo se agregan; nunca se editan. */
@Injectable()
export class PrismaTarifaRepository implements TarifaRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async vigente(tipo: TipoDeCancha): Promise<VersionDeTarifa | undefined> {
    const fila = await this.prisma.tarifaDeCancha.findFirst({
      where: { tipoDeCancha: tipo },
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LA_GUARDO,
    });
    return fila ? this.aVersion(fila) : undefined;
  }

  async historial(tipo: TipoDeCancha): Promise<VersionDeTarifa[]> {
    const filas = await this.prisma.tarifaDeCancha.findMany({
      where: { tipoDeCancha: tipo },
      orderBy: [...MAS_RECIENTE_PRIMERO],
      include: CON_QUIEN_LA_GUARDO,
      take: LIMITE_DEL_HISTORIAL,
    });
    return filas.map((fila) => this.aVersion(fila));
  }

  guardarSiCambia(
    tarifa: Tarifa,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeTarifa }> {
    return this.prisma.$transaction(async (tx) => {
      // Un guardado a la vez por tipo de cancha: dos iguales al mismo tiempo no se duplican.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`tarifa:${tarifa.tipo}`}))::text`;
      const actual = await tx.tarifaDeCancha.findFirst({
        where: { tipoDeCancha: tarifa.tipo },
        orderBy: [...MAS_RECIENTE_PRIMERO],
        include: CON_QUIEN_LA_GUARDO,
      });
      if (actual && this.aVersion(actual).tarifa.igualA(tarifa)) {
        return { cambio: false, version: this.aVersion(actual) };
      }
      const creada = await tx.tarifaDeCancha.create({
        data: {
          tipoDeCancha: tarifa.tipo,
          precioDia: tarifa.precioDia.enSoles(),
          precioNoche: tarifa.precioNoche.enSoles(),
          duracionDelTurnoHoras: tarifa.duracion.horas,
          ofreceTurnoCorto: tarifa.ofreceTurnoCorto,
          guardadaPorId,
          guardadaEn,
        },
        include: CON_QUIEN_LA_GUARDO,
      });
      return { cambio: true, version: this.aVersion(creada) };
    });
  }

  private aVersion(fila: FilaDeTarifa): VersionDeTarifa {
    const { nombresCifrado, apellidosCifrado } = fila.guardadaPor;
    return {
      tarifa: new Tarifa({
        tipo: fila.tipoDeCancha,
        precioDia: Monto.desdeCentimos(fila.precioDia.mul(100).toNumber()),
        precioNoche: Monto.desdeCentimos(fila.precioNoche.mul(100).toNumber()),
        duracion: DuracionDelTurno.restaurar(fila.duracionDelTurnoHoras),
        ofreceTurnoCorto: fila.ofreceTurnoCorto,
      }),
      guardadaEn: fila.guardadaEn,
      guardadaPor: [nombresCifrado, apellidosCifrado]
        .map((valor) => this.cifrador.descifrar(valor))
        .join(' '),
    };
  }
}
