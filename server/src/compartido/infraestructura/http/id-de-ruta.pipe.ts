import type { PipeTransform } from '@nestjs/common';

// Los ids son columnas `integer` de PostgreSQL: más allá de este valor la consulta falla.
const MAXIMO_ID = 2_147_483_647;

/**
 * Lee el id de la ruta. Uno que no es un entero positivo dentro del rango de la
 * base responde igual que uno que no existe, sin llegar a consultarla.
 */
export function idDeRuta(
  noEncontrado: () => Error,
): PipeTransform<string, number> {
  return {
    transform(valor: string): number {
      const id = /^\d{1,10}$/.test(valor) ? Number(valor) : 0;
      if (id < 1 || id > MAXIMO_ID) throw noEncontrado();
      return id;
    },
  };
}
