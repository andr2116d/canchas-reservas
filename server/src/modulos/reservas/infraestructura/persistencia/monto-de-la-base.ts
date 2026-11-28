import { Monto } from '../../../../compartido/dominio/monto.value-object';
import type { Prisma } from '../../../../generated/prisma/client';

/** Un monto `numeric(10, 2)` de la base, como objeto de valor. */
export const aMonto = (decimal: Prisma.Decimal) =>
  Monto.crear(decimal.toFixed(2));
