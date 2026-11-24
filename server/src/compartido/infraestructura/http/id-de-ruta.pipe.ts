import type { PipeTransform } from '@nestjs/common';
import { leerId } from '../../dominio/id';

/**
 * Lee el id de la ruta. Uno que no es un entero positivo dentro del rango de la
 * base responde igual que uno que no existe, sin llegar a consultarla.
 */
export function idDeRuta(
  noEncontrado: () => Error,
): PipeTransform<string, number> {
  return {
    transform(valor: string): number {
      const id = leerId(valor);
      if (id < 1) throw noEncontrado();
      return id;
    },
  };
}
