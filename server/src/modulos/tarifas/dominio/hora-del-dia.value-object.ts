import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const FORMATO = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Hora del día en formato de 24 horas (HH:MM), contada en minutos desde la medianoche. */
export class HoraDelDia {
  private constructor(readonly minutos: number) {}

  static crear(texto: string): HoraDelDia {
    const partes = FORMATO.exec(texto.trim());
    if (!partes) {
      throw new ValorInvalidoError(
        'Ingresa la hora como HH:MM, por ejemplo 18:00.',
      );
    }
    return new HoraDelDia(Number(partes[1]) * 60 + Number(partes[2]));
  }

  /** Admite 24:00 para el final de un turno que termina a medianoche. */
  static desdeMinutos(minutos: number): HoraDelDia {
    return new HoraDelDia(minutos);
  }

  get texto(): string {
    const horas = String(Math.floor(this.minutos / 60)).padStart(2, '0');
    return `${horas}:${String(this.minutos % 60).padStart(2, '0')}`;
  }
}
