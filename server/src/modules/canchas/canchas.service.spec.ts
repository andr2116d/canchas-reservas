import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CanchasService, MENSAJE_NOMBRE_DUPLICADO } from './canchas.service';

describe('CanchasService.crear', () => {
  const prisma = { cancha: { create: jest.fn() } };
  const servicio = new CanchasService(prisma as unknown as PrismaService);

  beforeEach(() => prisma.cancha.create.mockReset());

  it('crea la cancha sin enviar estado ni activa (la base pone OPERATIVA y activa)', async () => {
    prisma.cancha.create.mockResolvedValue({ id: 1 });

    await servicio.crear({
      nombre: 'Cancha 1',
      tamano: 'FUTBOL_5',
      iluminacion: true,
    });

    expect(prisma.cancha.create).toHaveBeenCalledWith({
      data: { nombre: 'Cancha 1', tamano: 'FUTBOL_5', iluminacion: true },
    });
  });

  it('convierte el duplicado de la base en 409 con el error en nombre', async () => {
    prisma.cancha.create.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
    );

    const error = await servicio
      .crear({ nombre: 'cancha 1', tamano: 'FUTBOL_5', iluminacion: true })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
    });
  });

  it('deja pasar cualquier otro error', async () => {
    prisma.cancha.create.mockRejectedValue(new Error('se cayó la base'));
    await expect(
      servicio.crear({
        nombre: 'Cancha 9',
        tamano: 'FUTBOL_7',
        iluminacion: false,
      }),
    ).rejects.toThrow('se cayó la base');
  });
});
