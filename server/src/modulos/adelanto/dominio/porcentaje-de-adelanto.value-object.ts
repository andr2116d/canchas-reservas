import { Monto } from '../../../compartido/dominio/monto.value-object';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const ENTERO = /^\d{1,3}$/;
const MINIMO = 1;
const MAXIMO = 100;

/** Parte del precio del turno que se paga como mínimo para separarlo. */
export class PorcentajeDeAdelanto {
  private constructor(readonly valor: number) {}

  static crear(texto: string): PorcentajeDeAdelanto {
    const limpio = texto.trim();
    if (limpio === '') {
      throw new ValorInvalidoError('Ingresa el porcentaje del adelanto.');
    }
    const valor = Number(limpio);
    if (!ENTERO.test(limpio) || valor < MINIMO || valor > MAXIMO) {
      throw new ValorInvalidoError('Usa un número entero de 1 a 100.');
    }
    return new PorcentajeDeAdelanto(valor);
  }

  /** Reconstruye un porcentaje ya guardado. */
  static restaurar(valor: number): PorcentajeDeAdelanto {
    return new PorcentajeDeAdelanto(valor);
  }

  /** Adelanto de un precio, redondeado a céntimos y nunca menor que un céntimo. */
  adelantoDe(precio: Monto): Monto {
    const centimos = Math.round((precio.centimos * this.valor) / MAXIMO);
    return Monto.desdeCentimos(Math.max(1, centimos));
  }

  igualA(otro: PorcentajeDeAdelanto): boolean {
    return this.valor === otro.valor;
  }
}
