import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const CIFRAS_DEL_CORRELATIVO = 6;
const FORMATO = /^(\d{1,6})-(\d{4})$/;
const MENSAJE =
  'Ingresa el número de hoja como aparece en la constancia, por ejemplo 000014-2026.';

/** Numeración correlativa de las hojas por año (DS 011-2011-PCM, art. 5): `000014-2026`. */
export class NumeroDeHoja {
  private constructor(
    readonly anio: number,
    readonly correlativo: number,
  ) {}

  static de(anio: number, correlativo: number): NumeroDeHoja {
    return new NumeroDeHoja(anio, correlativo);
  }

  /** Lee el número que escribe la persona para seguir su hoja. */
  static leer(texto: string): NumeroDeHoja {
    const partes = FORMATO.exec(texto.trim());
    const correlativo = partes ? Number(partes[1]) : 0;
    if (!partes || correlativo === 0) throw new ValorInvalidoError(MENSAJE);
    return new NumeroDeHoja(Number(partes[2]), correlativo);
  }

  get texto(): string {
    const cifras = String(this.correlativo).padStart(
      CIFRAS_DEL_CORRELATIVO,
      '0',
    );
    return `${cifras}-${this.anio}`;
  }
}
