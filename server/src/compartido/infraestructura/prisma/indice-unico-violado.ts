import { restriccionViolada } from './restriccion-violada';

// Código de Prisma para una restricción de unicidad violada.
const CODIGO_UNICIDAD = 'P2002';

/**
 * Si Prisma rechazó una escritura por un índice único, devuelve el nombre de
 * ese índice (por ejemplo `usuario_correo_hash_key`) para saber qué dato se repitió.
 */
export function indiceUnicoViolado(error: unknown): string | undefined {
  return restriccionViolada(error, CODIGO_UNICIDAD);
}
