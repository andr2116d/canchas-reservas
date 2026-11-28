import { Injectable } from '@nestjs/common';
import { Monto } from '../../../../compartido/dominio/monto.value-object';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type {
  RegistroDeCheckIn,
  ReservaParaCheckIn,
} from '../../aplicacion/check-in-de-reserva.use-case';
import { ReservaNoEncontradaError } from '../../dominio/reserva-no-encontrada.error';
import { aMonto } from './monto-de-la-base';
import { rechazarOperacionRepetida } from './prisma-pagos-de-reservas.adapter';

const CAMPOS = {
  id: true,
  codigo: true,
  estado: true,
  inicio: true,
  venceEn: true,
  precio: true,
  checkInEn: true,
  ventanaDeLlegada: { select: { minutosAntes: true, minutosDespues: true } },
  pagos: { select: { monto: true } },
} satisfies Prisma.ReservaSelect;

type Fila = Prisma.ReservaGetPayload<{ select: typeof CAMPOS }>;

function aReserva({
  precio,
  pagos,
  ventanaDeLlegada,
  ...resto
}: Fila): ReservaParaCheckIn {
  const centimos = pagos.reduce(
    (suma, pago) => suma + aMonto(pago.monto).centimos,
    0,
  );
  return {
    ...resto,
    precio: aMonto(precio),
    pagado: Monto.desdeCentimos(centimos),
    ventana: ventanaDeLlegada,
  };
}

@Injectable()
export class PrismaRegistroDeCheckInAdapter implements RegistroDeCheckIn {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(codigo: string) {
    const fila = await this.prisma.reserva.findUnique({
      where: { codigo },
      select: CAMPOS,
    });
    return fila ? aReserva(fila) : undefined;
  }

  async registrar(
    codigo: string,
    recepcionistaId: number,
    checkInEn: Date,
    decidirCobro: Parameters<RegistroDeCheckIn['registrar']>[3],
  ) {
    let numeroOperacion: string | null = null;
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Una solicitud espera a la otra antes de volver a leer el estado y el saldo.
        await tx.$queryRaw`SELECT id FROM reserva WHERE codigo = ${codigo} FOR UPDATE`;
        const fila = await tx.reserva.findUnique({
          where: { codigo },
          select: CAMPOS,
        });
        if (!fila) throw new ReservaNoEncontradaError();
        const cobro = decidirCobro(aReserva(fila));
        if (cobro && 'tipo' in cobro) return cobro;
        await tx.reserva.update({
          where: { id: fila.id, estado: 'CONFIRMADA' },
          data: {
            estado: 'EN_JUEGO',
            checkInEn,
            checkInPorId: recepcionistaId,
          },
        });
        if (cobro) {
          numeroOperacion = cobro.numeroOperacion;
          await tx.pago.create({
            data: {
              reservaId: fila.id,
              concepto: 'SALDO',
              monto: cobro.monto.enSoles(),
              metodo: cobro.metodo,
              numeroOperacion,
              registradoPorId: recepcionistaId,
              registradoEn: checkInEn,
            },
          });
        }
        return { tipo: 'realizado' as const, codigo, checkInEn };
      });
    } catch (error) {
      return rechazarOperacionRepetida(this.prisma, error, numeroOperacion);
    }
  }
}
