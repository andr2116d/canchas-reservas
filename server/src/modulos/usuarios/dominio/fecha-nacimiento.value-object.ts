import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const EDAD_MINIMA = 18;
const ANIO_MINIMO = 1900;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Fecha del calendario (AAAA-MM-DD) en Lima para un instante dado. */
function fechaEnLima(instante: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(
    instante,
  );
}

function esFechaReal(anio: number, mes: number, dia: number): boolean {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/**
 * Edad cumplida al día de hoy. Compara mes y día como texto: quien nació un
 * 29 de febrero cumple años el 1 de marzo en los años no bisiestos.
 */
function edadCumplida(nacimiento: string, hoy: string): number {
  const anios = Number(hoy.slice(0, 4)) - Number(nacimiento.slice(0, 4));
  return hoy.slice(5) < nacimiento.slice(5) ? anios - 1 : anios;
}

/** Fecha de nacimiento de una persona mayor de edad, que puede contratar una reserva. */
export class FechaNacimiento {
  private constructor(readonly fecha: string) {}

  /** @param ahora momento actual; la edad se calcula con la fecha de Lima. */
  static crear(fecha: string, ahora: Date): FechaNacimiento {
    const limpia = fecha.trim();
    if (limpia === '') {
      throw new ValorInvalidoError('Ingresa la fecha de nacimiento.');
    }
    const partes = FORMATO_FECHA.exec(limpia);
    if (!partes || !esFechaReal(+partes[1], +partes[2], +partes[3])) {
      throw new ValorInvalidoError('La fecha de nacimiento no es válida.');
    }
    const hoy = fechaEnLima(ahora);
    if (limpia > hoy) {
      throw new ValorInvalidoError(
        'La fecha de nacimiento no puede ser futura.',
      );
    }
    if (+partes[1] < ANIO_MINIMO) {
      throw new ValorInvalidoError('Revisa el año de la fecha de nacimiento.');
    }
    if (edadCumplida(limpia, hoy) < EDAD_MINIMA) {
      throw new ValorInvalidoError(`Debe tener al menos ${EDAD_MINIMA} años.`);
    }
    return new FechaNacimiento(limpia);
  }

  /** Reconstruye una fecha ya guardada, validada cuando se registró. */
  static restaurar(fecha: string): FechaNacimiento {
    return new FechaNacimiento(fecha);
  }
}
