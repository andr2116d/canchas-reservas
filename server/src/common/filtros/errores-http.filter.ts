import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { cuerpoError } from '../errores';

export const MENSAJE_RUTA_NO_ENCONTRADA = 'No se encontró la ruta solicitada';
export const MENSAJE_JSON_INVALIDO =
  'El cuerpo de la solicitud no es un JSON válido';
export const MENSAJE_SOLICITUD_INVALIDA =
  'La solicitud no tiene un formato válido';

function tieneFormato(cuerpo: unknown) {
  return typeof cuerpo === 'object' && cuerpo !== null && 'errores' in cuerpo;
}

function mensajeDe(excepcion: HttpException, peticion: Request) {
  if (excepcion instanceof NotFoundException) return MENSAJE_RUTA_NO_ENCONTRADA;
  return peticion.is('json')
    ? MENSAJE_JSON_INVALIDO
    : MENSAJE_SOLICITUD_INVALIDA;
}

@Catch(NotFoundException, BadRequestException)
export class ErroresHttpFilter implements ExceptionFilter {
  catch(excepcion: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const respuesta = http.getResponse<Response>();
    const estado = excepcion.getStatus();
    const cuerpo = excepcion.getResponse();
    respuesta
      .status(estado)
      .json(
        tieneFormato(cuerpo)
          ? cuerpo
          : cuerpoError(
              estado,
              mensajeDe(excepcion, http.getRequest<Request>()),
            ),
      );
  }
}
