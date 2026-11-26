// Código de Prisma para una restricción de unicidad violada.
const CODIGO_UNICIDAD = 'P2002';

interface ErrorDeUnicidad {
  code?: unknown;
  meta?: {
    driverAdapterError?: { cause?: { constraint?: { index?: string } } };
  };
}

/**
 * Si Prisma rechazó una escritura por un índice único, devuelve el nombre de
 * ese índice (por ejemplo `usuario_correo_hash_key`) para saber qué dato se repitió.
 */
export function indiceUnicoViolado(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, meta } = error as ErrorDeUnicidad;
  if (code !== CODIGO_UNICIDAD) return undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}
