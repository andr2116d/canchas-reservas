import type { Cifrador } from '../../aplicacion/cifrador.port';

/** Columnas que bastan para escribir el nombre de quien hizo un cambio. */
export const COLUMNAS_DEL_AUTOR = {
  nombresCifrado: true,
  apellidosCifrado: true,
} as const;

/** Nombres y apellidos descifrados, como «Valeria León Paredes». */
export function nombreDelAutor(
  cifrador: Pick<Cifrador, 'descifrar'>,
  autor: { nombresCifrado: string; apellidosCifrado: string },
): string {
  return [autor.nombresCifrado, autor.apellidosCifrado]
    .map((valor) => cifrador.descifrar(valor))
    .join(' ');
}
