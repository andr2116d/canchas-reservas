import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { UsosDeAdicional } from '../../aplicacion/usos-de-adicional.port';

/**
 * Un adicional se usó si alguna reserva lo pidió. Cuando existan la entrega y el cobro,
 * también contarán, pero ya basta el pedido para no borrarlo de lo registrado.
 */
@Injectable()
export class PrismaUsosDeAdicionalAdapter implements UsosDeAdicional {
  constructor(private readonly prisma: PrismaService) {}

  async conUsos(adicionalIds: number[]): Promise<Set<number>> {
    if (adicionalIds.length === 0) return new Set();
    const pedidos = await this.prisma.adicionalPedido.findMany({
      where: { adicionalId: { in: adicionalIds } },
      select: { adicionalId: true },
      distinct: ['adicionalId'],
    });
    return new Set(pedidos.map((pedido) => pedido.adicionalId));
  }
}
