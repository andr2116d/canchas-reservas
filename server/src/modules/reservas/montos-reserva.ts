import type { Prisma } from '../../generated/prisma/client';
import type { ConceptoPago } from '../../generated/prisma/enums';
import { aCentimos, aNumero, deCentimos } from '../tarifas/calculo-tarifa';

type Monto = Prisma.Decimal | number | string;

export interface PagoAprobado {
  concepto: ConceptoPago;
  monto: Monto;
}

const CONCEPTOS_DEL_TURNO: ConceptoPago[] = ['ADELANTO', 'SALDO'];

function sumar(pagos: PagoAprobado[], conceptos: ConceptoPago[]) {
  return pagos
    .filter((pago) => conceptos.includes(pago.concepto))
    .reduce((total, pago) => total + aCentimos(pago.monto), 0);
}

export function calcularMontosReserva(
  valorTurno: Monto,
  pagosAprobados: PagoAprobado[],
) {
  const adelanto = sumar(pagosAprobados, ['ADELANTO']);
  const pagado = sumar(pagosAprobados, CONCEPTOS_DEL_TURNO);
  const saldo = Math.max(aCentimos(valorTurno) - pagado, 0);
  return {
    adelantoPagado: aNumero(deCentimos(adelanto)),
    saldoPendiente: aNumero(deCentimos(saldo)),
  };
}
