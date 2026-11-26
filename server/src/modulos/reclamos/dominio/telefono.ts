import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/**
 * La hoja pide un teléfono, no solo celular: se acepta un celular de 9 dígitos o un fijo con su
 * código de ciudad (por ejemplo 044 123456). Espacios y guiones se quitan.
 */
export function leerTelefono(texto: string): string {
  const limpio = texto.replace(/[\s-]/g, '');
  if (limpio === '') throw new ValorInvalidoError('Ingresa el teléfono.');
  if (!/^\d{7,9}$/.test(limpio)) {
    throw new ValorInvalidoError(
      'Ingresa un teléfono de 7 a 9 dígitos: celular o fijo con su código de ciudad.',
    );
  }
  return limpio;
}
