import { normalizarNombre } from '../../../compartido/dominio/normalizar-nombre';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const LARGO_MAXIMO = 40;
// Letras (con tildes y ñ), números, espacios y signos que suelen llevar los nombres de canchas.
const PERMITIDOS = /^[\p{L}\p{N} .\-#'()º]+$/u;

/**
 * Nombre con el que el local identifica una cancha. Dos nombres que solo
 * difieren en mayúsculas, tildes o espacios se consideran el mismo.
 */
export class NombreDeCancha {
  private constructor(readonly valor: string) {}

  static crear(texto: string): NombreDeCancha {
    const valor = texto.trim().replace(/\s+/g, ' ');
    if (valor === '')
      throw new ValorInvalidoError('Ingresa el nombre de la cancha.');
    if (valor.length > LARGO_MAXIMO)
      throw new ValorInvalidoError(
        `Usa como máximo ${LARGO_MAXIMO} caracteres.`,
      );
    if (!PERMITIDOS.test(valor))
      throw new ValorInvalidoError(
        "Usa solo letras, números, espacios y los signos . - # ' ( ) º.",
      );
    return new NombreDeCancha(valor);
  }

  /** Forma para comparar y exigir que no se repita. */
  get normalizado(): string {
    return normalizarNombre(this.valor);
  }
}
