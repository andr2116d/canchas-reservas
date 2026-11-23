/** Dominio del correo del personal. Sale de la misma variable que usa la API. */
export function dominioCorporativo(): string {
  return process.env.DOMINIO_CORPORATIVO?.trim().toLowerCase() || "laprevia.pe";
}
