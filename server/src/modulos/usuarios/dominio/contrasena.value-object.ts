import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';

const LARGO_MINIMO = 8;
const LARGO_MAXIMO = 64;

/**
 * Contraseña en texto plano, solo mientras se valida y se convierte en hash.
 * Política: de 8 a 64 caracteres con al menos un número (OWASP permite largas).
 */
export class Contrasena {
  private constructor(readonly texto: string) {}

  static crear(texto: string): Contrasena {
    if (texto === '') throw new ValorInvalidoError('Ingresa una contraseña.');
    if (texto.length < LARGO_MINIMO) {
      throw new ValorInvalidoError(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }
    if (texto.length > LARGO_MAXIMO) {
      throw new ValorInvalidoError(
        'La contraseña no puede tener más de 64 caracteres.',
      );
    }
    if (!/\d/.test(texto)) {
      throw new ValorInvalidoError(
        'La contraseña debe incluir al menos un número.',
      );
    }
    return new Contrasena(texto);
  }

  /** Evita que la contraseña aparezca en registros o respuestas por accidente. */
  toString(): string {
    return '[contraseña oculta]';
  }

  toJSON(): string {
    return this.toString();
  }
}
