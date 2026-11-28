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
import { reservasQueRetienen } from '../../../../compartido/infraestructura/prisma/reservas-que-retienen';
import type {
  ReservaPorJugar,
  ReservasPorJugar,
} from '../../aplicacion/reservas-por-jugar.port';

/** Las reservas que aún no empiezan, con el nombre y el celular del titular para avisarle. */
@Injectable()
export class PrismaReservasPorJugarAdapter implements ReservasPorJugar {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async desde(ahora: Date): Promise<ReservaPorJugar[]> {
    const filas = await this.prisma.reserva.findMany({
      where: { ...reservasQueRetienen(ahora), inicio: { gt: ahora } },
      orderBy: [{ inicio: 'asc' }, { canchaId: 'asc' }],
      select: {
        codigo: true,
        inicio: true,
        fin: true,
        estado: true,
        cancha: { select: { nombre: true } },
        titular: { select: { ...COLUMNAS_DEL_AUTOR, celularCifrado: true } },
      },
    });
    return filas.map(({ cancha, titular, ...reserva }) => ({
      ...reserva,
      cancha: cancha.nombre,
      titular: {
        nombre: nombreDelAutor(this.cifrador, titular),
        celular: titular.celularCifrado
          ? this.cifrador.descifrar(titular.celularCifrado)
          : null,
      },
    }));
  }
}
