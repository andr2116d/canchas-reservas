import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const HORAS_MINIMAS = 1;
const HORAS_MAXIMAS = 12;

/** Cuántas horas dura el turno de un tipo de cancha: lo que se reserva y se cobra. */
export class DuracionDelTurno {
  private constructor(readonly horas: number) {}

  static crear(texto: string): DuracionDelTurno {
    const limpio = texto.trim();
    const horas = Number(limpio);
    if (
      !/^\d+$/.test(limpio) ||
      horas < HORAS_MINIMAS ||
      horas > HORAS_MAXIMAS
    ) {
      throw new ValorInvalidoError('Elige un turno de 1 a 12 horas enteras.');
    }
    return new DuracionDelTurno(horas);
  }

  static restaurar(horas: number): DuracionDelTurno {
    return new DuracionDelTurno(horas);
  }

  get minutos(): number {
    return this.horas * 60;
  }
}
