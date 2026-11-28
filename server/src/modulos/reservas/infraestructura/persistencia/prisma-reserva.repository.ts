import { Injectable } from '@nestjs/common';
import { exclusionViolada } from '../../../../compartido/infraestructura/prisma/exclusion-violada';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import { aMonto } from './monto-de-la-base';
import { CodigoRepetidoError } from '../../dominio/codigo-repetido.error';
import { LimiteDePendientesError } from '../../dominio/limite-de-pendientes.error';
import type {
  ReservaGuardada,
  ReservaNueva,
  ReservaRepository,
} from '../../dominio/reserva.repository';
import { TurnoNoDisponibleError } from '../../dominio/turno-no-disponible.error';

const DETALLE = {
  cancha: { select: { nombre: true, tipo: true, tieneIluminacion: true } },
  reglaDeCancelacion: { include: { rangos: true } },
  adicionalesPedidos: {
    include: { adicional: { select: { nombre: true, precio: true } } },
    orderBy: { adicionalId: 'asc' },
  },
} as const satisfies Prisma.ReservaInclude;

type FilaDeReserva = Prisma.ReservaGetPayload<{ include: typeof DETALLE }>;

/** Reservas sobre PostgreSQL: la base impide que dos reservas que retienen su turno se pisen. */
@Injectable()
export class PrismaReservaRepository implements ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(reserva: ReservaNueva, maximoDePendientes: number) {
    try {
      await this.prisma.$transaction((tx) =>
        this.crearEn(tx, reserva, maximoDePendientes),
      );
    } catch (error) {
      if (exclusionViolada(error, 'reserva_sin_cruces_excl'))
        throw new TurnoNoDisponibleError();
      if (indiceUnicoViolado(error) === 'reserva_codigo_key')
        throw new CodigoRepetidoError();
      throw error;
    }
  }

  async delTitular(
    titularId: number,
    codigo: string,
  ): Promise<ReservaGuardada | undefined> {
    const fila = await this.prisma.reserva.findFirst({
      where: { codigo, titularId },
      include: DETALLE,
    });
    return fila ? aGuardada(fila) : undefined;
  }

  /**
   * Con la cuenta bloqueada, expira las pendientes vencidas que estorban (las del titular y
   * las que chocan con el turno), cuenta las pendientes vigentes y guarda.
   */
  private async crearEn(
    tx: Prisma.TransactionClient,
    reserva: ReservaNueva,
    maximoDePendientes: number,
  ) {
    const { titularId, canchaId, inicio, fin, creadaEn } = reserva;
    await tx.$queryRaw`SELECT id FROM usuario WHERE id = ${titularId} FOR UPDATE`;
    await tx.reserva.updateMany({
      where: {
        estado: 'PENDIENTE_DE_PAGO',
        venceEn: { lte: creadaEn },
        OR: [
          { titularId },
          { canchaId, inicio: { lt: fin }, fin: { gt: inicio } },
        ],
      },
      data: { estado: 'EXPIRADA' },
    });
    const pendientes = await tx.reserva.count({
      where: { titularId, estado: 'PENDIENTE_DE_PAGO' },
    });
    if (pendientes >= maximoDePendientes)
      throw new LimiteDePendientesError(maximoDePendientes);
    await tx.reserva.create({ data: aFila(reserva) });
  }
}

function aFila({
  adicionalIds,
  precio,
  adelanto,
  creadaEn,
  ...resto
}: ReservaNueva): Prisma.ReservaUncheckedCreateInput {
  return {
    ...resto,
    estado: 'PENDIENTE_DE_PAGO',
    precio: precio.enSoles(),
    adelanto: adelanto.enSoles(),
    creadoEn: creadaEn,
    adicionalesPedidos: {
      create: adicionalIds.map((adicionalId) => ({ adicionalId })),
    },
  };
}

function aGuardada(fila: FilaDeReserva): ReservaGuardada {
  return {
    codigo: fila.codigo,
    estado: fila.estado,
    cancha: fila.cancha,
    inicio: fila.inicio,
    fin: fila.fin,
    precio: aMonto(fila.precio),
    porcentajeDeAdelanto: fila.porcentajeDeAdelanto,
    adelanto: aMonto(fila.adelanto),
    venceEn: fila.venceEn,
    creadaEn: fila.creadoEn,
    rangos: fila.reglaDeCancelacion.rangos.map(
      ({ desdeHoras, porcentaje, ofreceCredito }) => ({
        desdeHoras,
        porcentaje,
        ofreceCredito,
      }),
    ),
    adicionales: fila.adicionalesPedidos.map(({ adicional }) => ({
      nombre: adicional.nombre,
      precio: aMonto(adicional.precio),
    })),
  };
}
