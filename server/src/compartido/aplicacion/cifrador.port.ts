export const CIFRADOR = Symbol('CIFRADOR');

/** Protege los datos personales que se guardan en la base. */
export interface Cifrador {
  /** Cifra el texto. Cada llamada da un resultado distinto. */
  cifrar(texto: string): string;

  /** Recupera el texto original. Falla si el valor fue alterado. */
  descifrar(cifrado: string): string;

  /** Hash determinista para buscar o exigir unicidad sin descifrar. */
  hashParaBuscar(texto: string): string;
}
