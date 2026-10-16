import { PrismaService } from '../../prisma/prisma.service';
import { AccesosService } from './accesos.service';
import type { ConsultarAccesosDto } from './dto/consultar-accesos.dto';

describe('AccesosService.listar', () => {
  const prisma = {
    registroAcceso: { count: jest.fn(), findMany: jest.fn() },
  };
  const servicio = new AccesosService(prisma as unknown as PrismaService);
  const filtros = (datos: Partial<ConsultarAccesosDto> = {}) =>
    ({ pagina: 1, tamano: 20, ...datos }) as ConsultarAccesosDto;
  const argumentos = () =>
    prisma.registroAcceso.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
      orderBy: unknown;
      skip: number;
      take: number;
    };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.registroAcceso.count.mockResolvedValue(0);
    prisma.registroAcceso.findMany.mockResolvedValue([]);
  });

  it('sin filtros pide la primera página del más reciente al más antiguo', async () => {
    await servicio.listar(filtros());

    expect(argumentos()).toMatchObject({
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      skip: 0,
      take: 20,
    });
    expect(argumentos().where).toEqual({
      exito: undefined,
      correo: undefined,
      fecha: undefined,
    });
  });

  it('filtra por resultado, correo que contiene sin distinguir mayúsculas y fechas en Lima', async () => {
    await servicio.listar(
      filtros({
        exito: false,
        correo: 'Ana@',
        desde: '2026-10-01',
        hasta: '2026-10-16',
        pagina: 2,
        tamano: 10,
      }),
    );

    expect(argumentos()).toMatchObject({
      where: {
        exito: false,
        correo: { contains: 'Ana@', mode: 'insensitive' },
        fecha: {
          gte: new Date('2026-10-01T05:00:00.000Z'),
          lt: new Date('2026-10-17T05:00:00.000Z'),
        },
      },
      skip: 10,
      take: 10,
    });
    const { where } = prisma.registroAcceso.count.mock.calls[0][0] as {
      where: unknown;
    };
    expect(where).toEqual(argumentos().where);
  });

  it('escapa los comodines de LIKE en el correo', async () => {
    await servicio.listar(filtros({ correo: 'a_b%c\\d' }));

    expect(argumentos().where).toMatchObject({
      correo: { contains: 'a\\_b\\%c\\\\d', mode: 'insensitive' },
    });
  });

  it('exito true también filtra', async () => {
    await servicio.listar(filtros({ exito: true }));

    expect(argumentos().where).toMatchObject({ exito: true });
  });

  it('devuelve cada acceso con su usuario o null si el correo no existe', async () => {
    const fecha = new Date('2026-10-16T13:00:00.000Z');
    prisma.registroAcceso.count.mockResolvedValue(2);
    prisma.registroAcceso.findMany.mockResolvedValue([
      {
        id: 2,
        fecha,
        usuarioId: 1,
        correo: 'admin@laprevia.pe',
        exito: true,
        motivo: 'OK',
        ip: '127.0.0.1',
        usuario: {
          id: 1,
          nombres: 'Admin',
          apellidos: 'La Previa',
          rol: 'ADMINISTRADOR',
        },
      },
      {
        id: 1,
        fecha,
        usuarioId: null,
        correo: 'nadie@laprevia.pe',
        exito: false,
        motivo: 'CREDENCIALES',
        ip: null,
        usuario: null,
      },
    ]);

    expect(await servicio.listar(filtros())).toEqual({
      items: [
        {
          id: 2,
          fecha,
          correo: 'admin@laprevia.pe',
          usuario: { id: 1, nombre: 'Admin La Previa', rol: 'ADMINISTRADOR' },
          exito: true,
          motivo: 'OK',
          ip: '127.0.0.1',
        },
        {
          id: 1,
          fecha,
          correo: 'nadie@laprevia.pe',
          usuario: null,
          exito: false,
          motivo: 'CREDENCIALES',
          ip: null,
        },
      ],
      total: 2,
      pagina: 1,
      tamano: 20,
    });
  });
});
