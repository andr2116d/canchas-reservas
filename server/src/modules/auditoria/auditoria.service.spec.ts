import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService.registrar', () => {
  const prisma = { auditoria: { create: jest.fn() } };
  const servicio = new AuditoriaService(prisma as unknown as PrismaService);

  beforeEach(() => prisma.auditoria.create.mockReset());

  it('guarda la fila con los datos recibidos', async () => {
    prisma.auditoria.create.mockResolvedValue({ id: 1 });

    await servicio.registrar({
      usuarioId: 7,
      accion: 'EDITAR',
      entidad: 'RECEPCIONISTA',
      entidadId: 3,
      detalle: {
        anterior: { telefono: '911111111' },
        nuevo: { telefono: '922222222' },
      },
    });

    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: {
        usuarioId: 7,
        accion: 'EDITAR',
        entidad: 'RECEPCIONISTA',
        entidadId: 3,
        motivo: null,
        detalle: {
          anterior: { telefono: '911111111' },
          nuevo: { telefono: '922222222' },
        },
      },
    });
  });

  it('guarda usuarioId vacío como null (Sistema)', async () => {
    await servicio.registrar({
      accion: 'EXPIRAR',
      entidad: 'RESERVA',
      entidadId: 10,
    });

    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: null }) as unknown,
    });
  });

  it('pasa el motivo solo si viene', async () => {
    await servicio.registrar({
      usuarioId: 1,
      accion: 'CANCELAR',
      entidad: 'RESERVA',
      motivo: 'Lluvia',
    });

    expect(prisma.auditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        motivo: 'Lluvia',
        detalle: undefined,
      }) as unknown,
    });
  });

  it('quita passwordHash y contrasena del detalle en cualquier nivel', async () => {
    await servicio.registrar({
      usuarioId: 1,
      accion: 'CREAR',
      entidad: 'RECEPCIONISTA',
      entidadId: 4,
      detalle: {
        contrasena: 'secreta123',
        nuevo: {
          correo: 'ana@mail.com',
          passwordHash: 'hash',
          contactos: [{ telefono: '911111111', contrasena: 'otra' }],
        },
      },
    });

    const { data } = prisma.auditoria.create.mock.calls[0][0] as {
      data: { detalle: unknown };
    };
    expect(data.detalle).toEqual({
      nuevo: {
        correo: 'ana@mail.com',
        contactos: [{ telefono: '911111111' }],
      },
    });
    expect(JSON.stringify(data.detalle)).not.toMatch(
      /contrasena|passwordHash|secreta|hash|otra/,
    );
  });

  it('usa el cliente de transacción cuando se lo pasan', async () => {
    const tx = {
      auditoria: { create: jest.fn().mockResolvedValue({ id: 2 }) },
    };

    await servicio.registrar(
      { usuarioId: 1, accion: 'CREAR', entidad: 'CANCHA', entidadId: 5 },
      tx as unknown as Prisma.TransactionClient,
    );

    expect(tx.auditoria.create).toHaveBeenCalledTimes(1);
    expect(prisma.auditoria.create).not.toHaveBeenCalled();
  });
});
