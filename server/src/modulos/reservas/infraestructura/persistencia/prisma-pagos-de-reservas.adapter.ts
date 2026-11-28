import { Injectable } from '@nestjs/common';
import { ConflictoError } from '../../../../compartido/dominio/dominio.error';
import type { Monto } from '../../../../compartido/dominio/monto.value-object';
import { indiceUnicoViolado } from '../../../../compartido/infraestructura/prisma/indice-unico-violado';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { PagosDeReservas } from '../../aplicacion/pagos-de-reservas.port';
import { aMonto } from './monto-de-la-base';

@Injectable()
export class PrismaPagosDeReservasAdapter implements PagosDeReservas {
  constructor(private readonly prisma: PrismaService) {}

  async pagadoPor(reservaIds: number[]): Promise<Map<number, Monto>> {
    if (reservaIds.length === 0) return new Map();
    const pagos = await this.prisma.pago.groupBy({
      by: ['reservaId'],
      where: { reservaId: { in: reservaIds } },
      _sum: { monto: true },
    });
    return new Map(
      pagos.flatMap(({ reservaId, _sum }) =>
        _sum.monto ? [[reservaId, aMonto(_sum.monto)]] : [],
      ),
    );
  }
}

/** Consulta el código después del rollback para traducir la restricción de unicidad. */
export async function rechazarOperacionRepetida(
  prisma: PrismaService,
  error: unknown,
  numeroOperacion: string | null,
): Promise<never> {
  if (
    numeroOperacion &&
    indiceUnicoViolado(error) === 'pago_numero_operacion_key'
  ) {
    const pago = await prisma.pago.findUnique({
      where: { numeroOperacion },
      select: { reserva: { select: { codigo: true } } },
    });
    const mensaje = pago
      ? `El número de operación ya se usó en la reserva ${pago.reserva.codigo}.`
      : 'El número de operación ya se usó.';
    throw new ConflictoError(mensaje, { numeroOperacion: mensaje });
  }
  throw error;
}
