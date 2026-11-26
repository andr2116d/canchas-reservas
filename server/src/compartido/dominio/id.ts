// Los ids son columnas `integer` de PostgreSQL: más allá de este valor una consulta falla.
export const MAXIMO_ID = 2_147_483_647;

/** Un id entero positivo dentro del rango de la base, leído de un texto; si no lo es, cero. */
export function leerId(texto: string): number {
  const id = /^\d{1,10}$/.test(texto) ? Number(texto) : 0;
  return id <= MAXIMO_ID ? id : 0;
}
