import { Prisma } from '../../generated/prisma/client';

export interface CreditoVigente {
  id: number;
  saldo: Prisma.Decimal;
}

export interface UsoCredito {
  creditoId: number;
  monto: Prisma.Decimal;
}

export function repartirCredito(
  creditos: CreditoVigente[],
  adelanto: Prisma.Decimal,
) {
  const usos: UsoCredito[] = [];
  let pendiente = new Prisma.Decimal(adelanto);
  for (const credito of creditos) {
    if (pendiente.lte(0)) break;
    if (credito.saldo.lte(0)) continue;
    const monto = Prisma.Decimal.min(credito.saldo, pendiente);
    usos.push({ creditoId: credito.id, monto });
    pendiente = pendiente.minus(monto);
  }
  const aplicado = usos.reduce(
    (total, uso) => total.plus(uso.monto),
    new Prisma.Decimal(0),
  );
  return { aplicado, usos };
}
