import { PrismaService } from '../../prisma/prisma.service';
import { ConsultaAuditoriaService } from './consulta-auditoria.service';
import type { ConsultarAuditoriaDto } from './dto/consultar-auditoria.dto';
import {
  cargarReferencias,
  type FilaConReferencia,
} from './referencias-auditoria';

const fila = (
  entidad: string,
  entidadId: number | null,
  detalle: unknown = null,
): FilaConReferencia => ({ entidad, entidadId, detalle });

describe('cargarReferencias', () => {
  const prisma = {
    cancha: { findMany: jest.fn() },
    reserva: { findMany: jest.fn() },
    usuario: { findMany: jest.fn() },
    adicional: { findMany: jest.fn() },
  };
  const cargar = (filas: FilaConReferencia[]) =>
    cargarReferencias(prisma as unknown as PrismaService, filas);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.cancha.findMany.mockResolvedValue([
      { id: 1, nombre: 'Cancha 1' },
      { id: 2, nombre: 'Cancha 2' },
    ]);
    prisma.reserva.findMany.mockResolvedValue([
      { id: 50, codigo: 'LP7K2M9Q' },
      { id: 51, codigo: 'QW3E4R5T' },
    ]);
    prisma.usuario.findMany.mockResolvedValue([
      { id: 8, nombres: 'Ana', apellidos: 'Pérez' },
    ]);
    prisma.adicional.findMany.mockResolvedValue([{ id: 4, nombre: 'Agua' }]);
  });

  const idsPedidos = (tabla: keyof typeof prisma) =>
    (
      prisma[tabla].findMany.mock.calls[0][0] as {
        where: { id: { in: number[] } };
      }
    ).where.id.in;

  it('arma la referencia legible de cada entidad', async () => {
    const filas = [
      fila('CANCHA', 1),
      fila('TARIFA', 30, { canchaId: 2, franja: 'NOCHE' }),
      fila('TARIFA', 31, { canchaId: 1, franja: 'DIA' }),
      fila('RESERVA', 50, { codigo: 'LP7K2M9Q', canchaId: 1 }),
      fila('RECEPCIONISTA', 8),
      fila('ADICIONAL', 4),
      fila('HORARIO', null),
      fila('REGLA_CANCELACION', 1),
    ];

    const { referencia } = await cargar(filas);

    expect(filas.map(referencia)).toEqual([
      'Cancha 1',
      'Cancha 2 · Noche',
      'Cancha 1 · Día',
      'LP7K2M9Q',
      'Ana Pérez',
      'Agua',
      'Horario',
      'Regla de cancelación',
    ]);
  });

  it('hace una sola consulta por tabla sin repetir ids, con muchas filas', async () => {
    const filas = Array.from({ length: 40 }, (_, i) => [
      fila('CANCHA', 1 + (i % 2)),
      fila('TARIFA', 100 + i, { canchaId: 2, franja: 'DIA' }),
      fila('RESERVA', 50, { canchaId: 1 }),
      fila('RECEPCIONISTA', 8),
      fila('ADICIONAL', 4),
    ]).flat();

    await cargar(filas);

    for (const tabla of ['cancha', 'reserva', 'usuario', 'adicional'] as const)
      expect(prisma[tabla].findMany).toHaveBeenCalledTimes(1);
    expect(idsPedidos('cancha').sort((a, b) => a - b)).toEqual([1, 2]);
    expect(idsPedidos('reserva')).toEqual([50]);
    expect(idsPedidos('usuario')).toEqual([8]);
    expect(idsPedidos('adicional')).toEqual([4]);
  });

  it('no consulta las tablas que la página no necesita', async () => {
    await cargar([fila('HORARIO', null), fila('REGLA_CANCELACION', 1)]);

    for (const tabla of ['cancha', 'reserva', 'usuario', 'adicional'] as const)
      expect(prisma[tabla].findMany).not.toHaveBeenCalled();
  });

  it('pide los códigos de las reservas que quedaron fuera de horario', async () => {
    const { nombres } = await cargar([
      fila('HORARIO', null, { reservasFueraDeHorario: [51, 52] }),
    ]);

    expect(idsPedidos('reserva')).toEqual([51, 52]);
    expect(nombres.reserva(51)).toBe('QW3E4R5T');
    expect(nombres.reserva(52)).toBe('Reserva #52');
  });

  it('da nombres de canchas para el detalle de la reserva', async () => {
    const { nombres } = await cargar([fila('RESERVA', 50, { canchaId: 2 })]);

    expect(nombres.cancha(2)).toBe('Cancha 2');
    expect(nombres.cancha(9)).toBe('Cancha #9');
  });

  it('si el registro ya no existe usa el nombre guardado en el detalle', async () => {
    prisma.cancha.findMany.mockResolvedValue([]);
    prisma.reserva.findMany.mockResolvedValue([]);
    prisma.usuario.findMany.mockResolvedValue([]);
    prisma.adicional.findMany.mockResolvedValue([]);
    const filas = [
      fila('CANCHA', 7, { anterior: { id: 7, nombre: 'Cancha vieja' } }),
      fila('ADICIONAL', 9, { anterior: { nombre: 'Chalecos', precio: 5 } }),
      fila('RESERVA', 60, { codigo: 'ZX9C8V7B' }),
      fila('RECEPCIONISTA', 3, { nuevo: { nombres: 'Luis' } }),
    ];

    const { referencia } = await cargar(filas);

    expect(filas.map(referencia)).toEqual([
      'Cancha vieja',
      'Chalecos',
      'ZX9C8V7B',
      'Luis',
    ]);
  });

  it('sin nombre en ningún lado usa la entidad y el id', async () => {
    prisma.cancha.findMany.mockResolvedValue([]);
    prisma.reserva.findMany.mockResolvedValue([]);
    prisma.usuario.findMany.mockResolvedValue([]);
    prisma.adicional.findMany.mockResolvedValue([]);
    const filas = [
      fila('CANCHA', 7),
      fila('TARIFA', 30, { canchaId: 7, franja: 'NOCHE' }),
      fila('TARIFA', 31),
      fila('RESERVA', 60),
      fila('RECEPCIONISTA', 3),
      fila('ADICIONAL', 9),
      fila('PAGO', 5),
      fila('PAGO', null),
    ];

    const { referencia } = await cargar(filas);

    expect(filas.map(referencia)).toEqual([
      'Cancha #7',
      'Cancha #7 · Noche',
      'Tarifa #31',
      'Reserva #60',
      'Recepcionista #3',
      'Adicional #9',
      '#5',
      null,
    ]);
  });
});

describe('ConsultaAuditoriaService con referencias', () => {
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

  it('cada item trae su referencia y los cambios con el nombre de la cancha', async () => {
    prisma.auditoria.count.mockResolvedValue(2);
    prisma.auditoria.findMany.mockResolvedValue([
      {
        id: 2,
        fecha: new Date(),
        accion: 'CREAR',
        entidad: 'RESERVA',
        entidadId: 50,
        motivo: null,
        detalle: {
          codigo: 'LP7K2M9Q',
          canchaId: 1,
          fecha: '2026-10-20',
          horaInicio: '18:00',
          valorTurno: 80,
          adelantoMinimo: 40,
          creditoAplicado: 0,
        },
        usuario: { id: 5, nombres: 'Luis', apellidos: null, rol: 'JUGADOR' },
      },
      {
        id: 1,
        fecha: new Date(),
        accion: 'EDITAR',
        entidad: 'TARIFA',
        entidadId: 30,
        motivo: null,
        detalle: {
          canchaId: 1,
          franja: 'NOCHE',
          anterior: { valor: 80 },
          nuevo: { valor: 90 },
        },
        usuario: null,
      },
    ]);
    prisma.cancha.findMany.mockResolvedValue([{ id: 1, nombre: 'Cancha 1' }]);
    prisma.reserva.findMany.mockResolvedValue([{ id: 50, codigo: 'LP7K2M9Q' }]);

    const { items } = await servicio.listar({
      pagina: 1,
      tamano: 20,
    } as ConsultarAuditoriaDto);

    expect(items[0]).toMatchObject({ referencia: 'LP7K2M9Q' });
    expect(items[0].cambios[0]).toEqual({
      campo: 'cancha',
      anterior: null,
      nuevo: 'Cancha 1',
    });
    expect(items[1]).toMatchObject({
      referencia: 'Cancha 1 · Noche',
      cambios: [{ campo: 'valor', anterior: 80, nuevo: 90 }],
    });
    expect(prisma.cancha.findMany).toHaveBeenCalledTimes(1);
  });
});
