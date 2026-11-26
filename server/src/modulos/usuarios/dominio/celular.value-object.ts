import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

/** Número de celular peruano: 9 dígitos que empiezan con 9. No acepta fijos. */
export class Celular {
  private constructor(readonly numero: string) {}

  static crear(numero: string): Celular {
    const limpio = numero.trim();
    if (limpio === '') {
      throw new ValorInvalidoError('Ingresa el número de celular.');
    }
    if (!/^\d+$/.test(limpio)) {
      throw new ValorInvalidoError('El celular solo debe contener números.');
    }
    if (!limpio.startsWith('9')) {
      throw new ValorInvalidoError('El celular debe empezar con 9.');
    }
    if (limpio.length !== 9) {
      throw new ValorInvalidoError('El celular debe tener 9 dígitos.');
    }
    return new Celular(limpio);
  }
}
