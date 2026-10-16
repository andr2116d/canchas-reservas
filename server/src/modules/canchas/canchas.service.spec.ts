import { ConflictException, NotFoundException } from '@nestjs/common';
import { inicioDeHoyEnLima } from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import {
  CanchasService,
  MENSAJE_CON_HISTORIAL,
  MENSAJE_CONFIRMAR_DESACTIVAR,
  MENSAJE_ELIMINAR_CON_FUTURAS,
  MENSAJE_NOMBRE_DUPLICADO,
} from './canchas.service';

const ADMIN_ID = 7;

const CANCHA = {
  id: 3,
  nombre: 'Cancha 1',
  tamano: 'FUTBOL_5' as const,
  iluminacion: true,
  estado: 'OPERATIVA' as const,
  activa: true,
  _count: { tarifas: 2 },
};

const RESPUESTA = {
  id: 3,
  nombre: 'Cancha 1',
  tamano: 'FUTBOL_5',
  iluminacion: true,
  estado: 'OPERATIVA',
  activa: true,
  tieneTarifas: true,
};

const RESERVA_FUTURA = {
  id: 40,
  codigo: 'R-0040',
  fecha: new Date('2026-10-20T00:00:00.000Z'),
  horaInicio: '18:00',
  jugador: { nombres: 'Diego', apellidos: null },
};

describe('CanchasService', () => {
  const prisma = {
    cancha: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reserva: { findMany: jest.fn(), findFirst: jest.fn() },
    tarifa: { deleteMany: jest.fn() },
    bloqueo: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const gateway = { notificar: jest.fn() };
  const reloj = { ahora: jest.fn() };
  const servicio = new CanchasService(
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
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);

  describe('listar', () => {
    it('el administrador ve todas y tieneTarifas cuenta solo las vigentes', async () => {
      prisma.cancha.findMany.mockResolvedValue([
        CANCHA,
        { ...CANCHA, id: 4, activa: false, _count: { tarifas: 0 } },
      ]);

      const lista = await servicio.listar('ADMINISTRADOR');

      const consulta = prisma.cancha.findMany.mock.calls[0][0] as {
        where: unknown;
        select: { _count: unknown };
      };
      expect(consulta.where).toBeUndefined();
      expect(consulta.select._count).toEqual({
        select: { tarifas: { where: { vigenteHasta: null } } },
      });
      expect(lista).toEqual([
        RESPUESTA,
        { ...RESPUESTA, id: 4, activa: false, tieneTarifas: false },
      ]);
    });

    it.each(['JUGADOR', 'RECEPCIONISTA'] as const)(
      '%s solo ve las activas',
      async (rol) => {
        prisma.cancha.findMany.mockResolvedValue([]);
        await servicio.listar(rol);
        expect(prisma.cancha.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { activa: true } }),
        );
      },
    );
  });

  describe('crear', () => {
    it('crea sin enviar estado ni activa y registra CREAR en la transacción', async () => {
      prisma.cancha.create.mockResolvedValue({
        ...CANCHA,
        _count: { tarifas: 0 },
      });

      const cancha = await servicio.crear(
        { nombre: 'Cancha 1', tamano: 'FUTBOL_5', iluminacion: true },
        ADMIN_ID,
      );

      expect(prisma.cancha.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { nombre: 'Cancha 1', tamano: 'FUTBOL_5', iluminacion: true },
        }),
      );
      expect(cancha).toEqual({ ...RESPUESTA, tieneTarifas: false });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: ADMIN_ID,
          accion: 'CREAR',
          entidad: 'CANCHA',
          entidadId: 3,
          detalle: {
            nuevo: {
              nombre: 'Cancha 1',
              tamano: 'FUTBOL_5',
              iluminacion: true,
              estado: 'OPERATIVA',
              activa: true,
            },
          },
        },
        prisma,
      );
    });

    it('convierte el duplicado de la base en 409 con el error en nombre', async () => {
      prisma.cancha.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = await errorDe(
        servicio.crear(
          { nombre: 'cancha 1', tamano: 'FUTBOL_5', iluminacion: true },
          ADMIN_ID,
        ),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_NOMBRE_DUPLICADO,
        errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
      });
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('deja pasar cualquier otro error', async () => {
      prisma.cancha.create.mockRejectedValue(new Error('se cayó la base'));
      await expect(
        servicio.crear(
          { nombre: 'Cancha 9', tamano: 'FUTBOL_7', iluminacion: false },
          ADMIN_ID,
        ),
      ).rejects.toThrow('se cayó la base');
    });
  });

  describe('editar', () => {
    it('guarda solo los campos que cambiaron en la auditoría', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.cancha.update.mockResolvedValue({
        ...CANCHA,
        estado: 'EN_MANTENIMIENTO',
      });

      const cancha = await servicio.editar(
        3,
        { nombre: 'Cancha 1', estado: 'EN_MANTENIMIENTO' },
        ADMIN_ID,
      );

      expect(cancha).toEqual({ ...RESPUESTA, estado: 'EN_MANTENIMIENTO' });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EDITAR',
          entidadId: 3,
          detalle: {
            anterior: { estado: 'OPERATIVA' },
            nuevo: { estado: 'EN_MANTENIMIENTO' },
          },
        }),
        prisma,
      );
    });

    it('sin cambios devuelve la cancha sin actualizar ni auditar', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);

      const cancha = await servicio.editar(3, { iluminacion: true }, ADMIN_ID);

      expect(cancha).toEqual(RESPUESTA);
      expect(prisma.cancha.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('si no existe responde 404', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);
      await expect(
        servicio.editar(99, { nombre: 'Otra' }, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        servicio.editar(0, { nombre: 'Otra' }, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('con nombre repetido responde 409 en nombre', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.cancha.update.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = await errorDe(
        servicio.editar(3, { nombre: 'cancha 2' }, ADMIN_ID),
      );

      expect((error as ConflictException).getResponse()).toMatchObject({
        statusCode: 409,
        errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
      });
    });
  });

  describe('cambiarActiva', () => {
    it('desactivar con reservas futuras sin confirmar responde 409 con la lista', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findMany.mockResolvedValue([RESERVA_FUTURA]);

      const error = await errorDe(
        servicio.cambiarActiva(3, { activa: false }, ADMIN_ID),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_CONFIRMAR_DESACTIVAR,
        errores: {},
        reservasFuturas: [
          {
            id: 40,
            codigo: 'R-0040',
            fecha: '2026-10-20',
            horaInicio: '18:00',
            cliente: 'Diego',
          },
        ],
      });
      expect(prisma.cancha.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('busca reservas futuras por estado y desde hoy en Lima', async () => {
      const ahora = new Date('2026-10-16T03:30:00.000Z');
      reloj.ahora.mockReturnValue(ahora);
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findMany.mockResolvedValue([]);
      prisma.cancha.update.mockResolvedValue({ ...CANCHA, activa: false });

      await servicio.cambiarActiva(3, { activa: false }, ADMIN_ID);

      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            canchaId: 3,
            estado: {
              in: ['PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA'],
            },
            fecha: { gte: inicioDeHoyEnLima(ahora) },
          },
        }),
      );
    });

    it('con confirmar desactiva sin consultar ni tocar reservas y audita DESACTIVAR', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.cancha.update.mockResolvedValue({ ...CANCHA, activa: false });

      const cancha = await servicio.cambiarActiva(
        3,
        { activa: false, confirmar: true },
        ADMIN_ID,
      );

      expect(cancha).toEqual({ ...RESPUESTA, activa: false });
      expect(prisma.cancha.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 3 }, data: { activa: false } }),
      );
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: ADMIN_ID,
          accion: 'DESACTIVAR',
          detalle: { anterior: { activa: true }, nuevo: { activa: false } },
        }),
        prisma,
      );
    });

    it('activar una desactivada audita ACTIVAR sin revisar reservas', async () => {
      prisma.cancha.findUnique.mockResolvedValue({ ...CANCHA, activa: false });
      prisma.cancha.update.mockResolvedValue(CANCHA);

      await servicio.cambiarActiva(3, { activa: true }, ADMIN_ID);

      expect(prisma.reserva.findMany).not.toHaveBeenCalled();
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'ACTIVAR' }),
        prisma,
      );
    });

    it('pedir el valor que ya tiene no cambia nada', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);

      await servicio.cambiarActiva(3, { activa: true }, ADMIN_ID);

      expect(prisma.cancha.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('con reservas futuras responde 409 con la lista', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findFirst.mockResolvedValue({ id: 40 });
      prisma.reserva.findMany.mockResolvedValue([
        { ...RESERVA_FUTURA, jugador: { nombres: 'Diego', apellidos: 'Soto' } },
      ]);

      const error = await errorDe(servicio.eliminar(3, ADMIN_ID));

      expect((error as ConflictException).getResponse()).toMatchObject({
        statusCode: 409,
        message: MENSAJE_ELIMINAR_CON_FUTURAS,
        reservasFuturas: [{ id: 40, cliente: 'Diego Soto' }],
      });
      expect(prisma.cancha.delete).not.toHaveBeenCalled();
    });

    it('con solo reservas pasadas responde 409 con historial', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findFirst.mockResolvedValue({ id: 12 });
      prisma.reserva.findMany.mockResolvedValue([]);

      const error = await errorDe(servicio.eliminar(3, ADMIN_ID));

      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_CON_HISTORIAL,
        errores: {},
      });
      expect(prisma.tarifa.deleteMany).not.toHaveBeenCalled();
      expect(prisma.cancha.delete).not.toHaveBeenCalled();
    });

    it('sin reservas borra tarifas, bloqueos y la cancha y audita ELIMINAR', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findFirst.mockResolvedValue(null);
      prisma.tarifa.deleteMany.mockResolvedValue({ count: 2 });
      prisma.bloqueo.deleteMany.mockResolvedValue({ count: 1 });

      await servicio.eliminar(3, ADMIN_ID);

      expect(prisma.tarifa.deleteMany).toHaveBeenCalledWith({
        where: { canchaId: 3 },
      });
      expect(prisma.bloqueo.deleteMany).toHaveBeenCalledWith({
        where: { canchaId: 3 },
      });
      expect(prisma.cancha.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: ADMIN_ID,
          accion: 'ELIMINAR',
          entidad: 'CANCHA',
          entidadId: 3,
          detalle: {
            anterior: {
              id: 3,
              nombre: 'Cancha 1',
              tamano: 'FUTBOL_5',
              iluminacion: true,
              estado: 'OPERATIVA',
              activa: true,
            },
            tarifasBorradas: 2,
            bloqueosBorrados: 1,
          },
        },
        prisma,
      );
    });

    it('si aparece una reserva al borrar responde 409 con historial', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findFirst.mockResolvedValue(null);
      prisma.tarifa.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bloqueo.deleteMany.mockResolvedValue({ count: 0 });
      prisma.cancha.delete.mockRejectedValue(
        Object.assign(new Error('Foreign key'), { code: 'P2003' }),
      );

      const error = await errorDe(servicio.eliminar(3, ADMIN_ID));

      expect((error as ConflictException).getResponse()).toMatchObject({
        message: MENSAJE_CON_HISTORIAL,
      });
    });

    it('si no existe responde 404', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);
      await expect(servicio.eliminar(99, ADMIN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('notificación de turnos', () => {
    const duplicado = () =>
      Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    const transaccionFallida = () =>
      prisma.$transaction.mockRejectedValue(new Error('conexión perdida'));
    const NUEVA = {
      nombre: 'Cancha 9',
      tamano: 'FUTBOL_7' as const,
      iluminacion: false,
    };

    it('crear notifica la cancha creada para todas las fechas', async () => {
      prisma.cancha.create.mockResolvedValue({ ...CANCHA, id: 9 });
      await servicio.crear(
        { nombre: 'Cancha 9', tamano: 'FUTBOL_7', iluminacion: false },
        ADMIN_ID,
      );
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, 9);
    });

    it('editar notifica la cancha editada', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.cancha.update.mockResolvedValue({ ...CANCHA, nombre: 'Otra' });
      await servicio.editar(3, { nombre: 'Otra' }, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, 3);
    });

    it.each([
      { activa: false, confirmar: true, actual: true },
      { activa: true, confirmar: undefined, actual: false },
    ])(
      'cambiarActiva a $activa notifica la cancha',
      async ({ activa, confirmar, actual }) => {
        prisma.cancha.findUnique.mockResolvedValue({
          ...CANCHA,
          activa: actual,
        });
        prisma.cancha.update.mockResolvedValue({ ...CANCHA, activa });
        await servicio.cambiarActiva(3, { activa, confirmar }, ADMIN_ID);
        expect(gateway.notificar).toHaveBeenCalledTimes(1);
        expect(gateway.notificar).toHaveBeenCalledWith(null, 3);
      },
    );

    it('desactivar sin reservas futuras notifica la cancha', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findMany.mockResolvedValue([]);
      prisma.cancha.update.mockResolvedValue({ ...CANCHA, activa: false });
      await servicio.cambiarActiva(3, { activa: false }, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledWith(null, 3);
    });

    it('eliminar notifica la cancha eliminada', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.reserva.findFirst.mockResolvedValue(null);
      prisma.tarifa.deleteMany.mockResolvedValue({ count: 0 });
      prisma.bloqueo.deleteMany.mockResolvedValue({ count: 0 });
      await servicio.eliminar(3, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, 3);
    });

    it('notifica recién cuando la transacción confirma', async () => {
      prisma.cancha.findUnique.mockResolvedValue(CANCHA);
      prisma.cancha.update.mockResolvedValue({ ...CANCHA, nombre: 'Otra' });
      let confirmar: () => void = () => undefined;
      prisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) =>
          fn(prisma).then(
            (cancha) =>
              new Promise((resolve) => {
                confirmar = () => resolve(cancha);
              }),
          ),
      );
      const editando = servicio.editar(3, { nombre: 'Otra' }, ADMIN_ID);
      await new Promise((resolve) => setImmediate(resolve));
      expect(auditoria.registrar).toHaveBeenCalled();
      expect(gateway.notificar).not.toHaveBeenCalled();
      confirmar();
      await editando;
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
    });

    describe('no notifica', () => {
      afterEach(() => {
        expect(gateway.notificar).not.toHaveBeenCalled();
      });

      it('crear con nombre repetido', async () => {
        prisma.cancha.create.mockRejectedValue(duplicado());
        await errorDe(servicio.crear(NUEVA, ADMIN_ID));
      });

      it('crear con la transacción fallida', async () => {
        transaccionFallida();
        await errorDe(servicio.crear(NUEVA, ADMIN_ID));
      });

      it('editar una cancha que no existe', async () => {
        prisma.cancha.findUnique.mockResolvedValue(null);
        await errorDe(servicio.editar(99, { nombre: 'Otra' }, ADMIN_ID));
      });

      it('editar sin cambios', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        await servicio.editar(3, { nombre: 'Cancha 1' }, ADMIN_ID);
      });

      it('editar con nombre repetido', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        prisma.cancha.update.mockRejectedValue(duplicado());
        await errorDe(servicio.editar(3, { nombre: 'cancha 2' }, ADMIN_ID));
      });

      it('editar con la transacción fallida', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        transaccionFallida();
        await errorDe(servicio.editar(3, { nombre: 'Otra' }, ADMIN_ID));
      });

      it('cambiarActiva de una cancha que no existe', async () => {
        prisma.cancha.findUnique.mockResolvedValue(null);
        await errorDe(servicio.cambiarActiva(99, { activa: false }, ADMIN_ID));
      });

      it('cambiarActiva al valor que ya tiene', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        await servicio.cambiarActiva(3, { activa: true }, ADMIN_ID);
      });

      it('desactivar con reservas futuras sin confirmar', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        prisma.reserva.findMany.mockResolvedValue([RESERVA_FUTURA]);
        await errorDe(servicio.cambiarActiva(3, { activa: false }, ADMIN_ID));
      });

      it('cambiarActiva con la transacción fallida', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        transaccionFallida();
        await errorDe(
          servicio.cambiarActiva(
            3,
            { activa: false, confirmar: true },
            ADMIN_ID,
          ),
        );
      });

      it('eliminar una cancha que no existe', async () => {
        prisma.cancha.findUnique.mockResolvedValue(null);
        await errorDe(servicio.eliminar(99, ADMIN_ID));
      });

      it('eliminar con reservas futuras', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        prisma.reserva.findFirst.mockResolvedValue({ id: 40 });
        prisma.reserva.findMany.mockResolvedValue([RESERVA_FUTURA]);
        await errorDe(servicio.eliminar(3, ADMIN_ID));
      });

      it('eliminar con historial', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        prisma.reserva.findFirst.mockResolvedValue({ id: 12 });
        prisma.reserva.findMany.mockResolvedValue([]);
        await errorDe(servicio.eliminar(3, ADMIN_ID));
      });

      it('eliminar si aparece una reserva al borrar', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        prisma.reserva.findFirst.mockResolvedValue(null);
        prisma.tarifa.deleteMany.mockResolvedValue({ count: 0 });
        prisma.bloqueo.deleteMany.mockResolvedValue({ count: 0 });
        prisma.cancha.delete.mockRejectedValue(
          Object.assign(new Error('Foreign key'), { code: 'P2003' }),
        );
        await errorDe(servicio.eliminar(3, ADMIN_ID));
      });

      it('eliminar con la transacción fallida', async () => {
        prisma.cancha.findUnique.mockResolvedValue(CANCHA);
        transaccionFallida();
        await errorDe(servicio.eliminar(3, ADMIN_ID));
      });
    });
  });
});
