import { PrismaService } from '../../prisma/prisma.service';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';
import type { ConsultarAuditoriaDto } from './dto/consultar-auditoria.dto';

const fila = (datos: Record<string, unknown> = {}) => ({
  id: 1,
  fecha: new Date('2026-10-16T15:00:00.000Z'),
  usuarioId: 1,
  accion: 'EDITAR',
  entidad: 'HORARIO',
  entidadId: null,
  motivo: null,
  detalle: null,
  usuario: {
    id: 1,
    nombres: 'Ana',
    apellidos: 'Pérez',
    rol: 'ADMINISTRADOR',
  },
  ...datos,
});

describe('ConsultaAuditoriaService.listar', () => {
  const prisma = {
    auditoria: { count: jest.fn(), findMany: jest.fn() },
    cancha: { findMany: jest.fn() },
    reserva: { findMany: jest.fn() },
    usuario: { findMany: jest.fn() },
    adicional: { findMany: jest.fn() },
  };
  const servicio = new ConsultaAuditoriaService(
    prisma as unknown as PrismaService,
  );
  const filtros = (datos: Partial<ConsultarAuditoriaDto> = {}) =>
    ({ pagina: 1, tamano: 20, ...datos }) as ConsultarAuditoriaDto;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.auditoria.count.mockResolvedValue(0);
    prisma.auditoria.findMany.mockResolvedValue([]);
    for (const tabla of ['cancha', 'reserva', 'usuario', 'adicional'] as const)
      prisma[tabla].findMany.mockResolvedValue([]);
  });

  const argumentos = () =>
    prisma.auditoria.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
      orderBy: unknown;
      skip: number;
      take: number;
    };

  it('sin filtros pide la primera página del más reciente al más antiguo', async () => {
    await servicio.listar(filtros());

    expect(argumentos()).toMatchObject({
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: 0,
      take: 20,
    });
    expect(argumentos().where).toEqual({
      entidad: undefined,
      accion: undefined,
      usuarioId: undefined,
      fecha: undefined,
    });
  });

  it('usa el mismo filtro para contar y para listar', async () => {
    await servicio.listar(filtros({ entidad: 'CANCHA', accion: 'CREAR' }));

    const { where } = prisma.auditoria.count.mock.calls[0][0] as {
      where: unknown;
    };
    expect(where).toEqual(argumentos().where);
    expect(where).toMatchObject({ entidad: 'CANCHA', accion: 'CREAR' });
  });

  it('filtra por usuario', async () => {
    await servicio.listar(filtros({ usuarioId: 7 }));

    expect(argumentos().where).toMatchObject({ usuarioId: 7 });
  });

  it('el rango de fechas cubre los días completos en hora de Lima', async () => {
    await servicio.listar(
      filtros({ desde: '2026-10-16', hasta: '2026-10-17' }),
    );

    expect(argumentos().where.fecha).toEqual({
      gte: new Date('2026-10-16T05:00:00.000Z'),
      lt: new Date('2026-10-18T05:00:00.000Z'),
    });
  });

  it('acepta solo desde o solo hasta', async () => {
    await servicio.listar(filtros({ desde: '2026-10-16' }));
    await servicio.listar(filtros({ hasta: '2026-12-31' }));

    const fechas = prisma.auditoria.findMany.mock.calls.map(
      ([a]) => (a as { where: { fecha: unknown } }).where.fecha,
    );
    expect(fechas).toEqual([
      { gte: new Date('2026-10-16T05:00:00.000Z') },
      { lt: new Date('2027-01-01T05:00:00.000Z') },
    ]);
  });

  it('salta las páginas anteriores', async () => {
    await servicio.listar(filtros({ pagina: 3, tamano: 50 }));

    expect(argumentos()).toMatchObject({ skip: 100, take: 50 });
  });

  it('devuelve los items con el usuario resumido, el total y la página', async () => {
    prisma.auditoria.count.mockResolvedValue(41);
    prisma.auditoria.findMany.mockResolvedValue([
      fila({ id: 9, motivo: 'Lluvia' }),
    ]);

    const respuesta = await servicio.listar(filtros({ pagina: 2 }));

    expect(respuesta).toMatchObject({ total: 41, pagina: 2, tamano: 20 });
    expect(respuesta.items[0]).toMatchObject({
      id: 9,
      fecha: new Date('2026-10-16T15:00:00.000Z'),
      usuario: { id: 1, nombre: 'Ana Pérez', rol: 'ADMINISTRADOR' },
      accion: 'EDITAR',
      entidad: 'HORARIO',
      entidadId: null,
      motivo: 'Lluvia',
    });
  });

  it('sin usuario (Sistema) devuelve usuario null', async () => {
    prisma.auditoria.findMany.mockResolvedValue([
      fila({ usuarioId: null, usuario: null }),
    ]);

    const { items } = await servicio.listar(filtros());

    expect(items[0].usuario).toBeNull();
  });

  it('el nombre sin apellidos no deja espacios', async () => {
    prisma.auditoria.findMany.mockResolvedValue([
      fila({
        usuario: { id: 2, nombres: 'Luis', apellidos: null, rol: 'JUGADOR' },
      }),
    ]);

    const { items } = await servicio.listar(filtros());

    expect(items[0].usuario).toEqual({ id: 2, nombre: 'Luis', rol: 'JUGADOR' });
  });
});
