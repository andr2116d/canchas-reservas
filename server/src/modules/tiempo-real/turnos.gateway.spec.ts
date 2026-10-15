import { Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import { EVENTO_TURNOS_ACTUALIZADOS, TurnosGateway } from './turnos.gateway';

function crearGateway(server?: Partial<Server>) {
  const gateway = new TurnosGateway();
  Object.assign(gateway, { server });
  return gateway;
}

describe('TurnosGateway', () => {
  let aviso: jest.SpyInstance;

  beforeEach(() => {
    aviso = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('emite turnos:actualizados con la fecha y la cancha', () => {
    const emit = jest.fn();
    crearGateway({ emit }).notificar('2030-01-14', 3);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(EVENTO_TURNOS_ACTUALIZADOS, {
      fecha: '2030-01-14',
      canchaId: 3,
    });
  });

  it('emite null en los campos que aplican a todas', () => {
    const emit = jest.fn();
    crearGateway({ emit }).notificar(null, null);
    expect(emit).toHaveBeenCalledWith('turnos:actualizados', {
      fecha: null,
      canchaId: null,
    });
  });

  it.each(['2030-1-14', '14/01/2030', '2030-02-30', '2030-13-01', ''])(
    'no emite con la fecha inválida %p',
    (fecha) => {
      const emit = jest.fn();
      expect(() => crearGateway({ emit }).notificar(fecha, 3)).not.toThrow();
      expect(emit).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'no emite con el canchaId inválido %p',
    (canchaId) => {
      const emit = jest.fn();
      expect(() =>
        crearGateway({ emit }).notificar('2030-01-14', canchaId),
      ).not.toThrow();
      expect(emit).not.toHaveBeenCalled();
    },
  );

  it('no lanza error si el server de sockets todavía no existe', () => {
    expect(() => crearGateway().notificar('2030-01-14', 3)).not.toThrow();
  });

  it('no lanza error si la emisión falla', () => {
    const emit = jest.fn(() => {
      throw new Error('socket caído');
    });
    expect(() => crearGateway({ emit }).notificar(null, 3)).not.toThrow();
    expect(aviso).toHaveBeenCalled();
  });
});
