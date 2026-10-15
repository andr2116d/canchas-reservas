import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EstadoCancha, TamanoCancha } from '../../generated/prisma/enums';

import { CanchasService } from './canchas.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CanchasService', () => {
  let service: CanchasService;
  const prisma = {
    cancha: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma.cancha.create.mockReset();

    const modulo = await Test.createTestingModule({
      providers: [CanchasService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = modulo.get(CanchasService);
  });

  it('crea una cancha nueva OPERATIVA y activa', async () => {
    const cancha = {
      id: 1,
      nombre: 'Cancha 1',
      tamano: TamanoCancha.FUTBOL_5,
      iluminacion: true,
      estado: EstadoCancha.OPERATIVA,
      activa: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };
    prisma.cancha.create.mockResolvedValue(cancha);

    await expect(
      service.crear({
        nombre: 'Cancha 1',
        tamano: TamanoCancha.FUTBOL_5,
        iluminacion: true,
      }),
    ).resolves.toEqual(cancha);

    expect(prisma.cancha.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Cancha 1',
        tamano: TamanoCancha.FUTBOL_5,
        iluminacion: true,
        estado: EstadoCancha.OPERATIVA,
        activa: true,
      },
    });
  });

  it('lanza ConflictException cuando el nombre ya existe (sin importar mayúsculas)', async () => {
    prisma.cancha.create.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
    );

    await expect(
      service.crear({
        nombre: 'cancha 1',
        tamano: TamanoCancha.FUTBOL_5,
        iluminacion: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
