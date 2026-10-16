import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { cuerpoError } from '../errores';
import {
  ErroresHttpFilter,
  MENSAJE_JSON_INVALIDO,
  MENSAJE_RUTA_NO_ENCONTRADA,
  MENSAJE_SOLICITUD_INVALIDA,
} from './errores-http.filter';

function contexto(tipo: string | false = false) {
  const respuesta = { status: jest.fn(), json: jest.fn() };
  respuesta.status.mockReturnValue(respuesta);
  const peticion = { is: () => tipo };
  const host = {
    switchToHttp: () => ({
      getResponse: () => respuesta,
      getRequest: () => peticion,
    }),
  } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe('ErroresHttpFilter', () => {
  const filtro = new ErroresHttpFilter();

  it('responde en español el 404 de una ruta inexistente', () => {
    const { respuesta, host } = contexto();
    filtro.catch(new NotFoundException('Cannot GET /api/no-existe'), host);
    expect(respuesta.status).toHaveBeenCalledWith(404);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: MENSAJE_RUTA_NO_ENCONTRADA,
      errores: {},
    });
  });

  it('no cambia el 404 que un módulo lanza con su propio mensaje', () => {
    const { respuesta, host } = contexto();
    const cuerpo = cuerpoError(404, 'No se encontró la cancha');
    filtro.catch(new NotFoundException(cuerpo), host);
    expect(respuesta.status).toHaveBeenCalledWith(404);
    expect(respuesta.json).toHaveBeenCalledWith(cuerpo);
  });

  it('responde en español el 400 de un JSON mal formado', () => {
    const { respuesta, host } = contexto('json');
    filtro.catch(new BadRequestException('Unexpected end of JSON input'), host);
    expect(respuesta.status).toHaveBeenCalledWith(400);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: MENSAJE_JSON_INVALIDO,
      errores: {},
    });
  });

  it('responde en español otro 400 sin formato que no viene de un JSON', () => {
    const { respuesta, host } = contexto();
    filtro.catch(new BadRequestException('URI malformed'), host);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: MENSAJE_SOLICITUD_INVALIDA,
      errores: {},
    });
  });

  it('no cambia el 400 de validación con errores por campo', () => {
    const { respuesta, host } = contexto('json');
    const cuerpo = cuerpoError(400, 'Hora inválida', {
      apertura: 'Hora inválida',
    });
    filtro.catch(new BadRequestException(cuerpo), host);
    expect(respuesta.json).toHaveBeenCalledWith(cuerpo);
  });
});
