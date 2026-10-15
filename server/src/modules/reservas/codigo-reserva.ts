import { randomInt } from 'node:crypto';

const CARACTERES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const LARGO_CODIGO = 8;

export function generarCodigo(azar: (maximo: number) => number = randomInt) {
  let codigo = '';
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += CARACTERES[azar(CARACTERES.length)];
  }
  return codigo;
}
