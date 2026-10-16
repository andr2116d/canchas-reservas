import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  const contexto = (usuario?: { rol: string }) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ usuario }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => reflector.getAllAndOverride.mockReset());

  it('deja pasar si la ruta no pide roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contexto({ rol: 'JUGADOR' }))).toBe(true);
  });

  it('deja pasar si el rol del usuario está permitido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMINISTRADOR']);
    expect(guard.canActivate(contexto({ rol: 'ADMINISTRADOR' }))).toBe(true);
  });

  it('responde 403 "Acceso no autorizado" si el rol no coincide', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMINISTRADOR']);
    let error: unknown;
    try {
      guard.canActivate(contexto({ rol: 'JUGADOR' }));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual({
      statusCode: 403,
      message: 'Acceso no autorizado',
      errores: {},
    });
  });

  it('responde 403 si no hay usuario en la petición', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMINISTRADOR']);
    expect(() => guard.canActivate(contexto())).toThrow(ForbiddenException);
  });
});
