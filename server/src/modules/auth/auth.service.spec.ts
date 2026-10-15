import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthService,
  MENSAJE_CREDENCIALES,
  MENSAJE_CUENTA_INACTIVA,
} from './auth.service';

describe('AuthService', () => {
  const prisma = {
    usuario: { findUnique: jest.fn() },
    registroAcceso: { create: jest.fn() },
  };
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hash('Jugador123', 4);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jwt.signAsync.mockResolvedValue('token-firmado');
    const modulo = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = modulo.get(AuthService);
  });

  const usuario = (estado: 'ACTIVO' | 'INACTIVO' = 'ACTIVO') => ({
    id: 7,
    nombres: 'Luis',
    rol: 'JUGADOR',
    estado,
    passwordHash,
  });

  it('con credenciales correctas devuelve el usuario y el token, y registra OK', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario());
    const resultado = await service.iniciarSesion(
      'a@b.pe',
      'Jugador123',
      '1.1.1.1',
    );
    expect(resultado).toEqual({
      token: 'token-firmado',
      usuario: { id: 7, nombres: 'Luis', rol: 'JUGADOR' },
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '7', rol: 'JUGADOR' });
    expect(prisma.registroAcceso.create).toHaveBeenCalledWith({
      data: {
        usuarioId: 7,
        correo: 'a@b.pe',
        exito: true,
        motivo: 'OK',
        ip: '1.1.1.1',
      },
    });
  });

  it('con contraseña incorrecta responde 401 y registra CREDENCIALES', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario());
    const error = await service
      .iniciarSesion('a@b.pe', 'mala', undefined)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toMatchObject({
      statusCode: 401,
      message: MENSAJE_CREDENCIALES,
      errores: {},
    });
    expect(prisma.registroAcceso.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: 7,
        exito: false,
        motivo: 'CREDENCIALES',
      }),
    });
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('con correo inexistente responde el mismo 401 y registra sin usuario', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      service.iniciarSesion('x@b.pe', 'cualquiera'),
    ).rejects.toMatchObject({
      response: { message: MENSAJE_CREDENCIALES },
    });
    expect(prisma.registroAcceso.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: undefined,
        correo: 'x@b.pe',
        motivo: 'CREDENCIALES',
      }),
    });
  });

  it('con usuario inactivo responde 403 y registra INACTIVO', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario('INACTIVO'));
    const error = await service
      .iniciarSesion('a@b.pe', 'Jugador123')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toMatchObject({
      statusCode: 403,
      message: MENSAJE_CUENTA_INACTIVA,
    });
    expect(prisma.registroAcceso.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: 7,
        exito: false,
        motivo: 'INACTIVO',
      }),
    });
  });

  it('con usuario inactivo y contraseña incorrecta no revela que está inactivo', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario('INACTIVO'));
    await expect(
      service.iniciarSesion('a@b.pe', 'mala'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
