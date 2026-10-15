import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SaludController } from './salud.controller';

describe('SaludController', () => {
  const prisma = { $queryRaw: jest.fn() };
  let controller: SaludController;

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const modulo = await Test.createTestingModule({
      controllers: [SaludController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = modulo.get(SaludController);
  });

  it('responde ok sin consultar la base', () => {
    expect(controller.vivo()).toEqual({ estado: 'ok' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('responde ok cuando la base responde', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.listo()).resolves.toEqual({
      estado: 'ok',
      baseDeDatos: 'ok',
    });
  });

  it('responde 503 cuando la base no responde', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('sin conexion'));
    await expect(controller.listo()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
