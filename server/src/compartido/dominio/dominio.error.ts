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

/** El recurso pedido no existe o no corresponde a quien lo pide. */
export class NoEncontradoError extends DominioError {
  constructor(mensaje: string) {
    super(mensaje, {});
  }
}

/** Los datos chocan con información que ya existe. */
export class ConflictoError extends DominioError {
  /** @param datos información extra para resolver el conflicto, como la cuenta que se puede reactivar. */
  constructor(
    mensaje: string,
    errores: ErroresPorCampo,
    readonly datos?: Record<string, unknown>,
  ) {
    super(mensaje, errores);
  }
}

/** Se superó un límite de cambios en un tiempo, como cambiar la contraseña muchas veces en una hora. */
export class LimiteExcedidoError extends DominioError {
  constructor(mensaje: string) {
    super(mensaje, {});
  }
}
