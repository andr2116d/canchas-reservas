import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const ENTERO = /^[1-9]\d{0,3}$/;
const MINIMO = 1;
const MAXIMO = 1440;
const MS_POR_MINUTO = 60 * 1000;

/** Cuánto tiempo tiene quien separa un turno para pagar el adelanto, de 1 minuto a 24 horas. */
export class MinutosParaPagar {
  private constructor(readonly valor: number) {}

  static crear(texto: string): MinutosParaPagar {
    const limpio = texto.trim();
    if (limpio === '')
      throw new ValorInvalidoError('Ingresa los minutos para pagar.');
    const valor = Number(limpio);
    if (!ENTERO.test(limpio) || valor < MINIMO || valor > MAXIMO) {
      throw new ValorInvalidoError(
        'Usa un número entero de minutos, de 1 a 1440.',
      );
    }
    return new MinutosParaPagar(valor);
  }

  /** Reconstruye un plazo ya guardado. */
  static restaurar(valor: number): MinutosParaPagar {
    return new MinutosParaPagar(valor);
  }

  /** Una reserva vence al acabar el plazo o al empezar el turno, lo que llegue antes. */
  vencimiento(creadaEn: Date, inicio: Date): Date {
    const limite = new Date(creadaEn.getTime() + this.valor * MS_POR_MINUTO);
    return limite < inicio ? limite : inicio;
  }

  igualA(otro: MinutosParaPagar): boolean {
    return this.valor === otro.valor;
  }
}
