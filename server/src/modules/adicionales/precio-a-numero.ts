import { Prisma } from '../../generated/prisma/client';

type Monto = Prisma.Decimal | number | string;

/** Lleva el Decimal de la base a numero con 2 decimales. */
export function precioANumero(monto: Monto) {
  return new Prisma.Decimal(monto)
    .mul(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
    .div(100)
    .toNumber();
}

/** Redondea a 2 decimales el precio que llega del formulario. */
export function aPrecio(monto: Monto) {
  return new Prisma.Decimal(monto).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}
