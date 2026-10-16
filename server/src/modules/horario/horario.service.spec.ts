import { ConflictException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import { generarTurnos } from '../turnos/generar-turnos';
import {
  HorarioService,
  INICIO_NOCHE_POR_DEFECTO,
  MENSAJE_RESERVAS_FUERA_DE_HORARIO,
} from './horario.service';

const ADMIN_ID = 7;
const AHORA = new Date('2026-10-15T20:00:00.000Z');

const abierto = (diaSemana: number, apertura = '08:00', cierre = '23:00') => ({
  diaSemana,
  abierto: true,
  apertura,
  cierre,
});
const cerrado = (diaSemana: number) => ({
  diaSemana,
  abierto: false,
  apertura: null,
  cierre: null,
});
const SEMANA = [1, 2, 3, 4, 5, 6, 7].map((dia) => abierto(dia));

const reserva = (
  id: number,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  apellidos: string | null = 'Soto',
) => ({
  id,
  fecha: new Date(`${fecha}T00:00:00.000Z`),
  horaInicio,
  horaFin,
  cancha: { nombre: 'Cancha 1' },
  jugador: { nombres: 'Diego', apellidos },
});

describe('HorarioService', () => {
  const prisma = {
    horarioDia: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    configuracion: { findUnique: jest.fn(), upsert: jest.fn() },
    reserva: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const gateway = { notificar: jest.fn() };
  const reloj = { ahora: jest.fn() };
  const servicio = new HorarioService(
    prisma as unknown as PrismaService,
    auditoria as unknown as AuditoriaService,
    gateway as unknown as TurnosGateway,
    reloj as unknown as Reloj,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.horarioDia.findMany.mockResolvedValue(SEMANA);
    prisma.configuracion.findUnique.mockResolvedValue({ inicioNoche: '18:00' });
    prisma.reserva.findMany.mockResolvedValue([]);
    reloj.ahora.mockReturnValue(AHORA);
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);

  describe('obtener', () => {
    it('devuelve los 7 días ordenados y el inicio de noche', async () => {
      prisma.horarioDia.findMany.mockResolvedValue([...SEMANA].reverse());

      await expect(servicio.obtener()).resolves.toEqual({
        dias: SEMANA,
        inicioNoche: '18:00',
      });
    });

    it('un día sin fila sale cerrado y sin configuración la noche es la de defecto', async () => {
      prisma.horarioDia.findMany.mockResolvedValue(SEMANA.slice(0, 6));
      prisma.configuracion.findUnique.mockResolvedValue(null);

      const horario = await servicio.obtener();

      expect(horario.dias[6]).toEqual(cerrado(7));
      expect(horario.inicioNoche).toBe(INICIO_NOCHE_POR_DEFECTO);
    });
  });

  describe('franjaDe', () => {
    it.each([
      ['08:00', 'DIA'],
      ['17:59', 'DIA'],
      ['18:00', 'NOCHE'],
      ['22:30', 'NOCHE'],
    ])('con noche a las 18:00 la hora %s es %s', async (hora, franja) => {
      await expect(servicio.franjaDe(hora)).resolves.toBe(franja);
    });

    it('usa el inicio de noche guardado', async () => {
      prisma.configuracion.findUnique.mockResolvedValue({
        inicioNoche: '18:40',
      });

      await expect(servicio.franjaDe('18:20')).resolves.toBe('DIA');
      await expect(servicio.franjaDe('18:40')).resolves.toBe('NOCHE');
    });

    it.each([
      ['08:00', '23:00', '18:00'],
      ['08:00', '23:00', '19:00'],
      ['08:00', '23:00', '18:30'],
      ['06:30', '22:30', '17:00'],
      ['10:00', '20:00', '07:00'],
      ['10:00', '20:00', '23:30'],
    ])(
      'de %s a %s con noche a las %s coincide con la franja de cada turno generado',
      async (apertura, cierre, inicioNoche) => {
        prisma.configuracion.findUnique.mockResolvedValue({ inicioNoche });
        const turnos = generarTurnos(
          { abierto: true, apertura, cierre },
          inicioNoche,
        );

        expect(turnos.length).toBeGreaterThan(0);
        for (const turno of turnos) {
          await expect(servicio.franjaDe(turno.horaInicio)).resolves.toBe(
            turno.franja,
          );
        }
      },
    );
  });

  describe('diaDe y vistaPrevia', () => {
    it('busca el día de la semana de la fecha', async () => {
      prisma.horarioDia.findUnique.mockResolvedValue(
        abierto(2, '19:00', '23:00'),
      );

      const turnos = await servicio.vistaPrevia('2026-10-20');

      expect(prisma.horarioDia.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { diaSemana: 2 } }),
      );
      expect(turnos.map((t) => t.horaInicio)).toEqual([
        '19:00',
        '20:00',
        '21:00',
        '22:00',
      ]);
      expect(turnos.every((t) => t.franja === 'NOCHE')).toBe(true);
    });

    it('un día sin fila sale cerrado y sin turnos', async () => {
      prisma.horarioDia.findUnique.mockResolvedValue(null);

      await expect(servicio.diaDe('2026-10-25')).resolves.toEqual({
        dia: cerrado(7),
        inicioNoche: '18:00',
      });
      await expect(servicio.vistaPrevia('2026-10-25')).resolves.toEqual([]);
    });
  });

  describe('guardar', () => {
    const dias = (...cambios: ReturnType<typeof abierto | typeof cerrado>[]) =>
      SEMANA.map(
        (dia) => cambios.find((c) => c.diaSemana === dia.diaSemana) ?? dia,
      );

    it('guarda solo lo que cambió y audita EDITAR en la transacción', async () => {
      const respuesta = await servicio.guardar(
        {
          dias: dias(abierto(1, '08:15', '23:15'), {
            ...cerrado(7),
            apertura: '08:00',
            cierre: '23:00',
          }),
          inicioNoche: '18:30',
        },
        ADMIN_ID,
      );

      expect(prisma.horarioDia.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.horarioDia.upsert).toHaveBeenCalledWith({
        where: { diaSemana: 1 },
        update: { abierto: true, apertura: '08:15', cierre: '23:15' },
        create: abierto(1, '08:15', '23:15'),
      });
      expect(prisma.horarioDia.upsert).toHaveBeenCalledWith({
        where: { diaSemana: 7 },
        update: { abierto: false, apertura: null, cierre: null },
        create: cerrado(7),
      });
      expect(prisma.configuracion.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { inicioNoche: '18:30' },
        create: { id: 1, inicioNoche: '18:30' },
      });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: ADMIN_ID,
          accion: 'EDITAR',
          entidad: 'HORARIO',
          detalle: {
            anterior: { dias: [abierto(1), abierto(7)], inicioNoche: '18:00' },
            nuevo: {
              dias: [abierto(1, '08:15', '23:15'), cerrado(7)],
              inicioNoche: '18:30',
            },
          },
        },
        prisma,
      );
      expect(respuesta.dias[0]).toEqual(abierto(1, '08:15', '23:15'));
      expect(respuesta.dias[6]).toEqual(cerrado(7));
      expect(respuesta.inicioNoche).toBe('18:30');
    });

    it('si solo cambia la noche no toca los días', async () => {
      await servicio.guardar({ dias: dias(), inicioNoche: '19:00' }, ADMIN_ID);

      expect(prisma.horarioDia.upsert).not.toHaveBeenCalled();
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          detalle: {
            anterior: { inicioNoche: '18:00' },
            nuevo: { inicioNoche: '19:00' },
          },
        }),
        prisma,
      );
    });

    it('sin cambios no guarda ni audita', async () => {
      const respuesta = await servicio.guardar(
        { dias: [...dias()].reverse(), inicioNoche: '18:00' },
        ADMIN_ID,
      );

      expect(respuesta).toEqual({ dias: SEMANA, inicioNoche: '18:00' });
      expect(prisma.reserva.findMany).not.toHaveBeenCalled();
      expect(prisma.horarioDia.upsert).not.toHaveBeenCalled();
      expect(prisma.configuracion.upsert).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('busca reservas futuras por estado e inicio posterior a la hora del reloj', async () => {
      await servicio.guardar(
        { dias: dias(cerrado(3)), inicioNoche: '18:00' },
        ADMIN_ID,
      );

      const consulta = prisma.reserva.findMany.mock.calls[0][0] as {
        where: { estado: unknown; inicioEn: { gt: Date } };
      };
      expect(consulta.where.estado).toEqual({
        in: ['PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA'],
      });
      expect(consulta.where.inicioEn.gt).toBe(AHORA);
    });

    it('con reservas fuera del nuevo horario y sin confirmar responde 409 con la lista', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(40, '2026-10-20', '08:00', '09:00'),
        reserva(41, '2026-10-20', '10:00', '11:00'),
        reserva(42, '2026-10-21', '18:00', '19:00', null),
        reserva(43, '2026-10-22', '22:00', '23:00'),
      ]);

      const error = await errorDe(
        servicio.guardar(
          {
            dias: dias(abierto(2, '09:30', '23:00'), cerrado(3)),
            inicioNoche: '18:00',
          },
          ADMIN_ID,
        ),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_RESERVAS_FUERA_DE_HORARIO,
        errores: {},
        reservasFueraDeHorario: [
          {
            id: 40,
            cancha: 'Cancha 1',
            fecha: '2026-10-20',
            horaInicio: '08:00',
            jugador: 'Diego Soto',
          },
          {
            id: 41,
            cancha: 'Cancha 1',
            fecha: '2026-10-20',
            horaInicio: '10:00',
            jugador: 'Diego Soto',
          },
          {
            id: 42,
            cancha: 'Cancha 1',
            fecha: '2026-10-21',
            horaInicio: '18:00',
            jugador: 'Diego',
          },
        ],
      });
      expect(prisma.horarioDia.upsert).not.toHaveBeenCalled();
      expect(prisma.configuracion.upsert).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('un turno que sigue existiendo con otra noche no queda fuera', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(50, '2026-10-20', '17:00', '18:00'),
      ]);

      await expect(
        servicio.guardar({ dias: dias(), inicioNoche: '18:30' }, ADMIN_ID),
      ).resolves.toMatchObject({ inicioNoche: '18:30' });
    });

    it('con confirmar guarda, no toca las reservas y audita sus ids', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(40, '2026-10-21', '08:00', '09:00'),
      ]);

      await servicio.guardar(
        { dias: dias(cerrado(3)), inicioNoche: '18:00', confirmar: true },
        ADMIN_ID,
      );

      expect(prisma.horarioDia.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.reserva.findMany).toHaveBeenCalledTimes(1);
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          detalle: {
            anterior: { dias: [abierto(3)] },
            nuevo: { dias: [cerrado(3)] },
            reservasFueraDeHorario: [40],
          },
        }),
        prisma,
      );
    });

    it('sin reservas fuera guarda aunque no venga confirmar', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(40, '2026-10-20', '08:00', '09:00'),
      ]);

      await servicio.guardar(
        { dias: dias(cerrado(3)), inicioNoche: '18:00' },
        ADMIN_ID,
      );

      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          detalle: {
            anterior: { dias: [abierto(3)] },
            nuevo: { dias: [cerrado(3)] },
          },
        }),
        prisma,
      );
    });
  });

  describe('notificación de turnos', () => {
    const conDia = (cambio: ReturnType<typeof abierto | typeof cerrado>) =>
      SEMANA.map((dia) => (dia.diaSemana === cambio.diaSemana ? cambio : dia));

    it('al guardar notifica todas las fechas y canchas', async () => {
      await servicio.guardar(
        { dias: conDia(cerrado(3)), inicioNoche: '18:00' },
        ADMIN_ID,
      );
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, null);
    });

    it('si solo cambia la noche también notifica', async () => {
      await servicio.guardar({ dias: SEMANA, inicioNoche: '19:00' }, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledWith(null, null);
    });

    it('con confirmar y reservas fuera de horario notifica', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        reserva(40, '2026-10-21', '08:00', '09:00'),
      ]);
      await servicio.guardar(
        { dias: conDia(cerrado(3)), inicioNoche: '18:00', confirmar: true },
        ADMIN_ID,
      );
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, null);
    });

    it('notifica recién cuando la transacción confirma', async () => {
      let confirmar: () => void = () => undefined;
      prisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) =>
          fn(prisma).then(
            (resultado) =>
              new Promise((resolve) => {
                confirmar = () => resolve(resultado);
              }),
          ),
      );
      const guardando = servicio.guardar(
        { dias: conDia(cerrado(3)), inicioNoche: '18:00' },
        ADMIN_ID,
      );
      await new Promise((resolve) => setImmediate(resolve));
      expect(auditoria.registrar).toHaveBeenCalled();
      expect(gateway.notificar).not.toHaveBeenCalled();
      confirmar();
      await guardando;
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
    });

    describe('no notifica', () => {
      afterEach(() => {
        expect(gateway.notificar).not.toHaveBeenCalled();
      });

      it('sin cambios', async () => {
        await expect(
          servicio.guardar({ dias: SEMANA, inicioNoche: '18:00' }, ADMIN_ID),
        ).resolves.toEqual({ dias: SEMANA, inicioNoche: '18:00' });
      });

      it('con reservas fuera del nuevo horario sin confirmar', async () => {
        prisma.reserva.findMany.mockResolvedValue([
          reserva(40, '2026-10-21', '08:00', '09:00'),
        ]);
        await expect(
          servicio.guardar(
            { dias: conDia(cerrado(3)), inicioNoche: '18:00' },
            ADMIN_ID,
          ),
        ).rejects.toBeInstanceOf(ConflictException);
      });

      it('si la transacción falla', async () => {
        prisma.$transaction.mockRejectedValue(new Error('conexión perdida'));
        await expect(
          servicio.guardar(
            { dias: conDia(cerrado(3)), inicioNoche: '18:00' },
            ADMIN_ID,
          ),
        ).rejects.toThrow('conexión perdida');
      });

      it('si falla la auditoría dentro de la transacción', async () => {
        auditoria.registrar.mockRejectedValue(new Error('fallo al auditar'));
        await expect(
          servicio.guardar(
            { dias: conDia(cerrado(3)), inicioNoche: '18:00' },
            ADMIN_ID,
          ),
        ).rejects.toThrow('fallo al auditar');
      });
    });
  });
});
