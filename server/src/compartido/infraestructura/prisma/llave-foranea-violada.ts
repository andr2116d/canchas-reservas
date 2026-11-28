import { restriccionViolada } from './restriccion-violada';

// Código de Prisma para una llave foránea que impide borrar o escribir.
const CODIGO_LLAVE_FORANEA = 'P2003';

/**
 * Si Prisma rechazó la operación porque otra tabla todavía la referencia, devuelve el
 * nombre de esa llave (por ejemplo `adicional_pedido_adicional_id_fkey`).
 */
export function llaveForaneaViolada(error: unknown): string | undefined {
  return restriccionViolada(error, CODIGO_LLAVE_FORANEA);
}
