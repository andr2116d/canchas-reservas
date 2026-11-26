import { connection } from "next/server";

/**
 * Hora actual de la petición. Con Cache Components, `connection()` indica que
 * el valor es propio de cada petición y no se prerenderiza; debe usarse
 * dentro de un `<Suspense>`.
 */
export async function ahoraDeLaPeticion(): Promise<Date> {
  await connection();
  return new Date();
}
