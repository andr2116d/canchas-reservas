import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { cuerpoError } from '../errores';
import {
  ErroresHttpFilter,
  MENSAJE_RUTA_NO_ENCONTRADA,
} from './errores-http.filter';

function contexto() {
  const respuesta = { status: jest.fn(), json: jest.fn() };
  respuesta.status.mockReturnValue(respuesta);
  const host = {
    switchToHttp: () => ({ getResponse: () => respuesta }),
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
});
