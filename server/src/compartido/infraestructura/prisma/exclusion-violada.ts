// Código de PostgreSQL para una fila que viola una restricción de exclusión.
const CODIGO_DE_EXCLUSION = '23P01';

interface ErrorDelAdaptador {
  meta?: {
    driverAdapterError?: {
      cause?: { originalCode?: unknown; originalMessage?: unknown };
    };
  };
}

/**
 * Si la base rechazó una escritura por la restricción de exclusión indicada
 * (por ejemplo, dos rangos que se pisan). Prisma no le da un código propio:
 * el adaptador de PostgreSQL entrega el código y el mensaje originales.
 */
export function exclusionViolada(error: unknown, restriccion: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const causa = (error as ErrorDelAdaptador).meta?.driverAdapterError?.cause;
  return (
    causa?.originalCode === CODIGO_DE_EXCLUSION &&
    typeof causa.originalMessage === 'string' &&
    causa.originalMessage.includes(`"${restriccion}"`)
  );
}
