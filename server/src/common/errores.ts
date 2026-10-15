export function cuerpoError(
  statusCode: number,
  message: string,
  errores: Record<string, string> = {},
) {
  return { statusCode, message, errores };
}
