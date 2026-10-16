import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { cuerpoError } from '../errores';

export const MENSAJE_RUTA_NO_ENCONTRADA = 'No se encontró la ruta solicitada';

function tieneFormato(cuerpo: unknown) {
  return typeof cuerpo === 'object' && cuerpo !== null && 'errores' in cuerpo;
}

@Catch(NotFoundException)
export class ErroresHttpFilter implements ExceptionFilter {
  catch(excepcion: HttpException, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const estado = excepcion.getStatus();
    const cuerpo = excepcion.getResponse();
    respuesta
      .status(estado)
      .json(
        tieneFormato(cuerpo)
          ? cuerpo
          : cuerpoError(estado, MENSAJE_RUTA_NO_ENCONTRADA),
      );
  }
}
