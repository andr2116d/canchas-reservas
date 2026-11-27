import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { Monto } from '../../../../compartido/dominio/monto.value-object';
import {
  COLUMNAS_DEL_AUTOR,
  nombreDelAutor,
} from '../../../../compartido/infraestructura/cifrado/nombre-del-autor';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type {
  AgendaDelLocal,
  CanchaDeLaAgenda,
  ReservaDeLaAgenda,
} from '../../aplicacion/agenda-del-local.port';

const CANCHA = { id: true, nombre: true, tipo: true } as const;

// Solo lo que recepción necesita para atender: nunca el documento ni el correo.
const FILA = {
  id: true,
  codigo: true,
  estado: true,
  inicio: true,
  fin: true,
  venceEn: true,
  precio: true,
  adelanto: true,
  cancha: { select: CANCHA },
  titular: { select: { ...COLUMNAS_DEL_AUTOR, celularCifrado: true } },
} as const satisfies Prisma.ReservaSelect;

type FilaDeLaAgenda = Prisma.ReservaGetPayload<{ select: typeof FILA }>;

const aMonto = (decimal: Prisma.Decimal) => Monto.crear(decimal.toFixed(2));

/** Lee las reservas de un día con el nombre y el celular del titular descifrados. */
@Injectable()
export class PrismaAgendaDelLocalAdapter implements AgendaDelLocal {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  canchas(): Promise<CanchaDeLaAgenda[]> {
    return this.prisma.cancha.findMany({
      select: CANCHA,
      orderBy: { id: 'asc' },
    });
  }

  async reservasDelDia(desde: Date, hasta: Date): Promise<ReservaDeLaAgenda[]> {
    const filas = await this.prisma.reserva.findMany({
      where: { inicio: { gte: desde, lt: hasta } },
      select: FILA,
      orderBy: [{ inicio: 'asc' }, { canchaId: 'asc' }],
    });
    return filas.map((fila) => this.aReserva(fila));
  }

  private aReserva({ titular, precio, adelanto, ...fila }: FilaDeLaAgenda) {
    return {
      ...fila,
      precio: aMonto(precio),
      adelanto: aMonto(adelanto),
      cliente: {
        nombre: nombreDelAutor(this.cifrador, titular),
        celular: titular.celularCifrado
          ? this.cifrador.descifrar(titular.celularCifrado)
          : null,
      },
    };
  }
}
