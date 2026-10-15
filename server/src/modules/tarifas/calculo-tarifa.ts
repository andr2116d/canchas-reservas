import { Prisma } from '../../generated/prisma/client';

type Monto = Prisma.Decimal | number | string;

export function aCentimos(monto: Monto) {
  return new Prisma.Decimal(monto)
    .mul(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function deCentimos(centimos: number) {
  return new Prisma.Decimal(centimos).div(100).toDecimalPlaces(2);
}

export function aNumero(monto: Monto) {
  return deCentimos(aCentimos(monto)).toNumber();
}
