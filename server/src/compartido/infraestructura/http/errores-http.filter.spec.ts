import {
  type ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../dominio/dominio.error';
import { ErroresHttpFilter } from './errores-http.filter';

/** Respuesta HTTP falsa que recuerda el estado y el cuerpo enviados. */
function capturarRespuesta(error: unknown) {
  const enviado: { estado?: number; cuerpo?: unknown } = {};
  const respuesta = {
    status(estado: number) {
      enviado.estado = estado;
      return this;
    },
    json(cuerpo: unknown) {
      enviado.cuerpo = cuerpo;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => respuesta }),
  } as unknown as ArgumentsHost;

  const filtro = new ErroresHttpFilter();
  jest.spyOn(filtro['registro'], 'error').mockImplementation(() => undefined);
  filtro.catch(error, host);
  return enviado;
}

describe('ErroresHttpFilter', () => {
  it('responde 400 con los mensajes por campo de una regla inválida', () => {
    const enviado = capturarRespuesta(
      new ReglaInvalidaError({ celular: 'El celular debe empezar con 9.' }),
    );

    expect(enviado).toEqual({
      estado: 400,
      cuerpo: {
        mensaje: 'Revisa los datos marcados.',
        errores: { celular: 'El celular debe empezar con 9.' },
      },
    });
  });

  it('responde 409 ante un conflicto con datos existentes', () => {
    const enviado = capturarRespuesta(
      new ConflictoError('Ya existe una cuenta con estos datos.', {
        correo: 'Ya existe una cuenta con este correo.',
      }),
    );

    expect(enviado.estado).toBe(409);
    expect(enviado.cuerpo).toEqual({
      mensaje: 'Ya existe una cuenta con estos datos.',
      errores: { correo: 'Ya existe una cuenta con este correo.' },
    });
  });

  it('conserva el cuerpo en español que arma la validación de entrada', () => {
    const cuerpo = { mensaje: 'Revisa los datos marcados.', errores: {} };

    expect(capturarRespuesta(new BadRequestException(cuerpo)).cuerpo).toEqual(
      cuerpo,
    );
  });

  it.each([
    [new BadRequestException(), 400, 'La solicitud no es válida.'],
    [new UnauthorizedException(), 401, 'Inicia sesión para continuar.'],
    [new ForbiddenException(), 403, 'No tienes permiso para hacer esto.'],
    [new NotFoundException(), 404, 'No encontramos lo que buscas.'],
    [
      new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
      429,
      'Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.',
    ],
  ])('traduce %s a un mensaje en español', (error, estado, mensaje) => {
    expect(capturarRespuesta(error)).toEqual({
      estado,
      cuerpo: { mensaje, errores: {} },
    });
  });

  it('responde 500 sin detalles internos ante un error inesperado', () => {
    const enviado = capturarRespuesta(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    );

    expect(enviado.estado).toBe(500);
    expect(JSON.stringify(enviado.cuerpo)).not.toContain('ECONNREFUSED');
    expect(enviado.cuerpo).toEqual({
      mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      errores: {},
    });
  });
});
