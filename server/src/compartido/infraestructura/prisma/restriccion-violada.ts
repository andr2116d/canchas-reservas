interface ErrorDeRestriccion {
  code?: unknown;
  meta?: {
    driverAdapterError?: { cause?: { constraint?: { index?: string } } };
  };
}

/** Si Prisma rechazó la operación con ese código, el nombre de la restricción que la impidió. */
export function restriccionViolada(
  error: unknown,
  codigo: string,
): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, meta } = error as ErrorDeRestriccion;
  if (code !== codigo) return undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}
