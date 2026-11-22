import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const LARGO_MAXIMO = 80;

/** Nombres o apellidos de una persona: obligatorios y con un largo acotado. */
export class NombrePersona {
  private constructor(readonly texto: string) {}

  /** @param etiqueta qué se está nombrando, para armar el mensaje de error. */
  static crear(texto: string, etiqueta: 'nombres' | 'apellidos'): NombrePersona {
    const limpio = texto.trim().replace(/\s+/g, ' ');
    if (limpio === '') throw new ValorInvalidoError(`Ingresa tus ${etiqueta}.`);
    if (limpio.length > LARGO_MAXIMO) {
      throw new ValorInvalidoError(
        `Tus ${etiqueta} no pueden tener más de ${LARGO_MAXIMO} caracteres.`,
      );
    }
    return new NombrePersona(limpio);
  }
}
