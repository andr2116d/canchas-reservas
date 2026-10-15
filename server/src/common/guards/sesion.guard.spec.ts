import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SesionGuard } from './sesion.guard';

describe('SesionGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const jwt = { verifyAsync: jest.fn(), signAsync: jest.fn() };
  const prisma = { usuario: { findUnique: jest.fn() } };
  const respuesta = { cookie: jest.fn(), clearCookie: jest.fn() };
  let guard: SesionGuard;

  const contexto = (cookies: Record<string, string> = {}) => {
    const peticion: Record<string, unknown> = { cookies };
    return {
      peticion,
      ctx: {
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({
          getRequest: () => peticion,
          getResponse: () => respuesta,
        }),
      } as unknown as ExecutionContext,
    };
  };

  const fila = (estado: 'ACTIVO' | 'INACTIVO' = 'ACTIVO') => ({
    id: 3,
    nombres: 'Ana',
    apellidos: 'Paz',
    correo: 'ana@laprevia.pe',
    rol: 'ADMINISTRADOR',
    estado,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
    jwt.signAsync.mockResolvedValue('token-nuevo');
    guard = new SesionGuard(
      reflector as unknown as Reflector,
      jwt as never,
      prisma as unknown as PrismaService,
    );
  });

  it('deja pasar las rutas públicas sin revisar la cookie', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contexto().ctx)).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('sin cookie responde 401', async () => {
    await expect(guard.canActivate(contexto().ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('con token válido deja el usuario en la petición y renueva la cookie', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: '3', rol: 'ADMINISTRADOR' });
    prisma.usuario.findUnique.mockResolvedValue(fila());
    const { ctx, peticion } = contexto({ sesion: 'token' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    expect(peticion.usuario).toEqual({
      id: 3,
      nombres: 'Ana',
      apellidos: 'Paz',
      correo: 'ana@laprevia.pe',
      rol: 'ADMINISTRADOR',
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '3', rol: 'ADMINISTRADOR' });
    expect(respuesta.cookie).toHaveBeenCalledWith(
      'sesion',
      'token-nuevo',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      }),
    );
  });

  it('con token vencido responde 401 y borra la cookie', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(guard.canActivate(contexto({ sesion: 'viejo' }).ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(respuesta.clearCookie).toHaveBeenCalledWith('sesion', expect.any(Object));
    expect(respuesta.cookie).not.toHaveBeenCalled();
  });

  it('con usuario inactivo responde 401 y borra la cookie', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: '3' });
    prisma.usuario.findUnique.mockResolvedValue(fila('INACTIVO'));
    await expect(guard.canActivate(contexto({ sesion: 'token' }).ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(respuesta.clearCookie).toHaveBeenCalledWith('sesion', expect.any(Object));
    expect(respuesta.cookie).not.toHaveBeenCalled();
  });

  it('con usuario que ya no existe responde 401 y borra la cookie', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: '99' });
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(contexto({ sesion: 'token' }).ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(respuesta.clearCookie).toHaveBeenCalled();
  });
});
