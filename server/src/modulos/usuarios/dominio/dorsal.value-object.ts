import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const DORSAL_MINIMO = 1;
const DORSAL_MAXIMO = 99;

/** Número de camiseta que el jugador elige para su ficha. Es opcional. */
export class Dorsal {
  private constructor(readonly numero: number) {}

  /** Devuelve `undefined` si la persona no eligió dorsal. */
  static crearOpcional(texto: string | undefined): Dorsal | undefined {
    const limpio = texto?.trim() ?? '';
    if (limpio === '') return undefined;
    if (!/^\d+$/.test(limpio)) {
      throw new ValorInvalidoError('El dorsal solo debe contener números.');
    }
    const numero = Number(limpio);
    if (numero < DORSAL_MINIMO || numero > DORSAL_MAXIMO) {
      throw new ValorInvalidoError('El dorsal debe estar entre 1 y 99.');
    }
    return new Dorsal(numero);
  }

  /** Reconstruye un dorsal ya guardado. */
  static restaurar(numero: number): Dorsal {
    return new Dorsal(numero);
  }
}
