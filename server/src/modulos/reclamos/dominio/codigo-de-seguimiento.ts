import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/** Letras y números sin los que se confunden al leerlos en voz alta o en papel (0, O, 1, I). */
export const ALFABETO_DEL_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LARGO_DEL_CODIGO = 8;

const FORMATO = new RegExp(`^[${ALFABETO_DEL_CODIGO}]{${LARGO_DEL_CODIGO}}$`);

/** El código en dos grupos de cuatro, como se muestra en la constancia: `K7QP-4ZMD`. */
export function formatearCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

/** Normaliza el código que escribe la persona (mayúsculas, sin espacios ni guion) y lo valida. */
export function leerCodigo(texto: string): string {
  const limpio = texto.toUpperCase().replace(/[\s-]/g, '');
  if (!FORMATO.test(limpio)) {
    throw new ValorInvalidoError(
      'Ingresa el código de seguimiento de 8 caracteres de la constancia.',
    );
  }
  return limpio;
}
