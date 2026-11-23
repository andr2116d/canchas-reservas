import { ValorInvalidoError } from './valor-invalido.error';

// Soles con hasta dos decimales; se acepta punto o coma.
const FORMATO = /^(\d+)(?:[.,](\d+))?$/;
const MAXIMO_EN_CENTIMOS = 9_999_999;

/** Monto en soles, con IGV incluido, guardado en céntimos para no perder precisión. */
export class Monto {
  private constructor(readonly centimos: number) {}

  static crear(texto: string): Monto {
    const limpio = texto.trim();
    if (limpio === '') throw new ValorInvalidoError('Ingresa el monto.');
    const partes = FORMATO.exec(limpio);
    if (!partes) {
      throw new ValorInvalidoError(
        'Ingresa el monto en soles, por ejemplo 50 o 49.90.',
      );
    }
    const [, soles, decimales = ''] = partes;
    if (decimales.length > 2) {
      throw new ValorInvalidoError('Usa como máximo dos decimales.');
    }
    const centimos = Number(soles) * 100 + Number(decimales.padEnd(2, '0'));
    if (centimos === 0) {
      throw new ValorInvalidoError('El monto debe ser mayor que cero.');
    }
    if (centimos > MAXIMO_EN_CENTIMOS) {
      throw new ValorInvalidoError('El monto no puede pasar de S/ 99999.99.');
    }
    return new Monto(centimos);
  }

  /** Reconstruye un monto guardado o calculado. */
  static desdeCentimos(centimos: number): Monto {
    return new Monto(centimos);
  }

  /** Soles con dos decimales, como «49.90». */
  enSoles(): string {
    const soles = Math.floor(this.centimos / 100);
    return `${soles}.${String(this.centimos % 100).padStart(2, '0')}`;
  }
}
