import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuditoriaService } from '../src/modules/auditoria/auditoria.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tabla auditoria (e2e, contra Postgres)', () => {
  const entidad = 'PRUEBA';
  let prisma: PrismaService;
  let auditoria: AuditoriaService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [AuditoriaService],
    }).compile();
    await modulo.init();
    prisma = modulo.get(PrismaService);
    auditoria = modulo.get(AuditoriaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registrar() guarda la fila con usuario vacío como Sistema', async () => {
    const detalle = {
      anterior: { telefono: '911111111' },
      nuevo: { telefono: '922222222' },
    };

    const creada = await auditoria.registrar({
      accion: 'EDITAR',
      entidad,
      entidadId: 1,
      detalle,
    });

    const guardada = await prisma.auditoria.findUniqueOrThrow({
      where: { id: creada.id },
    });
    expect(guardada).toMatchObject({
      usuarioId: null,
      accion: 'EDITAR',
      entidad,
      entidadId: 1,
      motivo: null,
      detalle,
    });
    expect(guardada.fecha).toBeInstanceOf(Date);
  });

  it('registrar() dentro de una transacción fallida no deja la fila', async () => {
    const accion = `TX_${Date.now()}`;

    await expect(
      prisma.$transaction(async (tx) => {
        await auditoria.registrar({ accion, entidad }, tx);
        throw new Error('falla a propósito');
      }),
    ).rejects.toThrow('falla a propósito');

    expect(await prisma.auditoria.count({ where: { accion, entidad } })).toBe(
      0,
    );
  });

  it('registrar() dentro de una transacción exitosa guarda la fila', async () => {
    const accion = `TX_OK_${Date.now()}`;

    await prisma.$transaction((tx) =>
      auditoria.registrar({ accion, entidad }, tx),
    );

    expect(await prisma.auditoria.count({ where: { accion, entidad } })).toBe(
      1,
    );
  });

  it('la tabla rechaza UPDATE', async () => {
    const fila = await auditoria.registrar({ accion: 'CREAR', entidad });

    await expect(
      prisma.auditoria.update({
        where: { id: fila.id },
        data: { accion: 'OTRA' },
      }),
    ).rejects.toThrow(/no se puede modificar ni eliminar/);
  });

  it('la tabla rechaza DELETE', async () => {
    const fila = await auditoria.registrar({ accion: 'CREAR', entidad });

    await expect(
      prisma.auditoria.delete({ where: { id: fila.id } }),
    ).rejects.toThrow(/no se puede modificar ni eliminar/);
    expect(await prisma.auditoria.count({ where: { id: fila.id } })).toBe(1);
  });
});
