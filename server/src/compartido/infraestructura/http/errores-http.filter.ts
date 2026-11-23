import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ConflictoError,
  DominioError,
  type ErroresPorCampo,
  NoEncontradoError,
} from '../../dominio/dominio.error';

/** Forma de toda respuesta de error de la API. */
export interface CuerpoDeError {
  mensaje: string;
  errores: ErroresPorCampo;
  /** Información para resolver un conflicto, como la cuenta que se puede reactivar. */
  datos?: Record<string, unknown>;
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Inicia sesión para continuar.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscas.',
  413: 'Los datos enviados son demasiado grandes.',
  429: 'Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.',
};
const MENSAJE_INESPERADO = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

function esCuerpoDeError(valor: unknown): valor is CuerpoDeError {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof (valor as CuerpoDeError).mensaje === 'string'
  );
}

function estadoDelError(error: DominioError): HttpStatus {
  if (error instanceof ConflictoError) return HttpStatus.CONFLICT;
  if (error instanceof NoEncontradoError) return HttpStatus.NOT_FOUND;
  return HttpStatus.BAD_REQUEST;
}

/**
 * Convierte cualquier error en una respuesta en español con la forma
 * `{ mensaje, errores }`. Los errores inesperados se registran y responden 500
 * sin trazas ni mensajes internos.
 */
@Catch()
export class ErroresHttpFilter implements ExceptionFilter {
  private readonly registro = new Logger('ErroresHttp');

  catch(error: unknown, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const [estado, cuerpo] = this.traducir(error);
    respuesta.status(estado).json(cuerpo);
  }

  private traducir(error: unknown): [number, CuerpoDeError] {
    if (error instanceof DominioError) {
      const estado = estadoDelError(error);
      const datos = error instanceof ConflictoError ? error.datos : undefined;
      return [
        estado,
        {
          mensaje: error.message,
          errores: error.errores,
          ...(datos && { datos }),
        },
      ];
    }
    if (error instanceof HttpException) {
      const estado = error.getStatus();
      const cuerpo = error.getResponse();
      if (esCuerpoDeError(cuerpo)) return [estado, cuerpo];
      const mensaje = MENSAJES_POR_ESTADO[estado] ?? MENSAJE_INESPERADO;
      return [estado, { mensaje, errores: {} }];
    }
    this.registro.error(error instanceof Error ? error.stack : String(error));
    return [
      HttpStatus.INTERNAL_SERVER_ERROR,
      { mensaje: MENSAJE_INESPERADO, errores: {} },
    ];
  }
}
