import { ValorInvalidoError } from './valor-invalido.error';

// Largo máximo de una dirección según RFC 5321.
const LARGO_MAXIMO = 254;

// Formato de correo del estándar HTML (WHATWG), exigiendo al menos un punto en el dominio.
const FORMATO_CORREO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Dirección de correo. Solo se valida su formato; no se envía verificación. */
export class Correo {
  private constructor(readonly direccion: string) {}

  /** Guarda la dirección en minúscula para que la búsqueda no dependa de mayúsculas. */
  static crear(direccion: string): Correo {
    const normalizada = direccion.trim().toLowerCase();
    if (normalizada === '') throw new ValorInvalidoError('Ingresa el correo.');
    if (normalizada.length > LARGO_MAXIMO) {
      throw new ValorInvalidoError(
        'El correo no puede tener más de 254 caracteres.',
      );
    }
    if (!FORMATO_CORREO.test(normalizada)) {
      throw new ValorInvalidoError('El correo no tiene un formato válido.');
    }
    return new Correo(normalizada);
  }
}
