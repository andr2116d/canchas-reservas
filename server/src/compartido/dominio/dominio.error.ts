/** Mensajes para la persona, indexados por el nombre del campo que los causó. */
export type ErroresPorCampo = Record<string, string>;

/**
 * Error de una regla de negocio. Lleva los mensajes por campo para que la capa
 * HTTP los devuelva tal cual, sin exponer detalles internos.
 */
export abstract class DominioError extends Error {
  protected constructor(
    mensaje: string,
    readonly errores: ErroresPorCampo,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Uno o más datos no cumplen su formato o su regla. */
export class ReglaInvalidaError extends DominioError {
  constructor(errores: ErroresPorCampo) {
    super('Revisa los datos marcados.', errores);
  }
}

/** Los datos chocan con información que ya existe. */
export class ConflictoError extends DominioError {
  constructor(mensaje: string, errores: ErroresPorCampo) {
    super(mensaje, errores);
  }
}
