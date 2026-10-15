import { BadRequestException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DisponibilidadService,
  MENSAJE_FUERA_DE_RANGO,
} from './disponibilidad.service';
import type { Turno } from './generar-turnos';
import { TurnosService } from './turnos.service';

const HOY = '2026-10-20';
/** 15:20 en Lima: el turno de las 15:00 ya pasó y el de las 16:00 no. */
const AHORA = new Date('2026-10-20T20:20:00.000Z');

const TURNO_DIA: Turno = {
  horaInicio: '15:00',
  horaFin: '16:00',
  franja: 'DIA',
};
const TURNO_SIGUIENTE: Turno = {
  horaInicio: '16:00',
  horaFin: '17:00',
  franja: 'DIA',
};
const TURNO_NOCHE: Turno = {
  horaInicio: '19:00',
  horaFin: '20:00',
  franja: 'NOCHE',
};

describe('DisponibilidadService', () => {
  const prisma = {
    cancha: { findMany: jest.fn() },
    reserva: { findMany: jest.fn() },
    tarifa: { findMany: jest.fn() },
  };
  const reloj = { ahora: jest.fn() };
  const turnos = { generar: jest.fn() };
  const servicio = new DisponibilidadService(
    prisma as unknown as PrismaService,
    reloj as unknown as Reloj,
    turnos as unknown as TurnosService,
  );

  const cancha = (datos: Record<string, unknown> = {}) => ({
    id: 1,
    nombre: 'Cancha 1',
    tamano: 'FUTBOL_7',
    iluminacion: true,
    estado: 'OPERATIVA',
    ...datos,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    reloj.ahora.mockReturnValue(AHORA);
    turnos.generar.mockResolvedValue([TURNO_DIA, TURNO_NOCHE]);
    prisma.cancha.findMany.mockResolvedValue([cancha()]);
    prisma.reserva.findMany.mockResolvedValue([]);
    prisma.tarifa.findMany.mockResolvedValue([
      { canchaId: 1, franja: 'DIA', valor: 60 },
      { canchaId: 1, franja: 'NOCHE', valor: 90 },
    ]);
  });

  describe('rango de fechas', () => {
    it.each([
      ['la fecha de ayer', '2026-10-19'],
      ['la fecha de hoy más 31 días', '2026-11-20'],
    ])('%s devuelve 400', async (_caso, fecha) => {
      await expect(servicio.consultar({ fecha })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(servicio.consultar({ fecha })).rejects.toThrow(
        MENSAJE_FUERA_DE_RANGO,
      );
    });

    it('rechaza la fecha antes de tocar la base de datos', async () => {
      await expect(
        servicio.consultar({ fecha: '2026-10-19' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(turnos.generar).not.toHaveBeenCalled();
      expect(prisma.cancha.findMany).not.toHaveBeenCalled();
    });

    it.each(['2026-10-20', '2026-11-19'])(
      'acepta la fecha %s',
      async (fecha) => {
        const respuesta = await servicio.consultar({ fecha });

        expect(respuesta.fecha).toBe(fecha);
        expect(respuesta.abierto).toBe(true);
      },
    );
  });

  describe('estado de los turnos', () => {
    it('hoy a las 15:20 el turno de 15:00 sale no seleccionable con PASADO', async () => {
      turnos.generar.mockResolvedValue([TURNO_DIA, TURNO_SIGUIENTE]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos[0]).toEqual({
        horaInicio: '15:00',
        horaFin: '16:00',
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'PASADO',
      });
    });

    it('hoy a las 15:20 el turno de 16:00 sale seleccionable', async () => {
      turnos.generar.mockResolvedValue([TURNO_DIA, TURNO_SIGUIENTE]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos[1]).toEqual({
        horaInicio: '16:00',
        horaFin: '17:00',
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 60,
        adelanto: 30,
      });
    });

    it.each([
      ['PENDIENTE_PAGO', 'PENDIENTE'],
      ['PENDIENTE_VALIDACION', 'PENDIENTE'],
      ['CONFIRMADA', 'OCUPADO'],
      ['EN_JUEGO', 'OCUPADO'],
      ['FINALIZADA', 'OCUPADO'],
    ])('una reserva %s deja el turno %s', async (estado, esperado) => {
      prisma.reserva.findMany.mockResolvedValue([
        { canchaId: 1, horaInicio: TURNO_NOCHE.horaInicio, estado },
      ]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos[1]).toEqual({
        horaInicio: TURNO_NOCHE.horaInicio,
        horaFin: TURNO_NOCHE.horaFin,
        franja: 'NOCHE',
        estado: esperado,
        seleccionable: false,
      });
    });

    it.each(['CANCELADA', 'EXPIRADA', 'AUSENTE'])(
      'una reserva %s no se consulta y no ocupa el turno',
      async (estado) => {
        const { canchas } = await servicio.consultar({ fecha: HOY });

        expect(prisma.reserva.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              estado: { in: expect.not.arrayContaining([estado]) },
            }),
          }),
        );
        expect(canchas[0].turnos[1]).toMatchObject({
          estado: 'DISPONIBLE',
          seleccionable: true,
        });
      },
    );

    it('una cancha en mantenimiento muestra todos sus turnos en mantenimiento', async () => {
      prisma.cancha.findMany.mockResolvedValue([
        cancha({ estado: 'EN_MANTENIMIENTO' }),
      ]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos).toEqual([
        { ...TURNO_DIA, estado: 'EN_MANTENIMIENTO', seleccionable: false },
        { ...TURNO_NOCHE, estado: 'EN_MANTENIMIENTO', seleccionable: false },
      ]);
    });

    it('una cancha en mantenimiento no muestra su estado interno', async () => {
      prisma.cancha.findMany.mockResolvedValue([
        cancha({ estado: 'EN_MANTENIMIENTO' }),
      ]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0]).not.toHaveProperty('estado');
    });

    it('una cancha sin tarifa de noche marca los turnos de noche con SIN_TARIFA', async () => {
      // A las 14:00 ningún turno del día todavía pasó, así se ve el precio.
      reloj.ahora.mockReturnValue(new Date('2026-10-20T19:00:00.000Z'));
      prisma.tarifa.findMany.mockResolvedValue([
        { canchaId: 1, franja: 'DIA', valor: 60 },
      ]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos[0]).toMatchObject({
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 60,
        adelanto: 30,
      });
      expect(canchas[0].turnos[1]).toEqual({
        horaInicio: TURNO_NOCHE.horaInicio,
        horaFin: TURNO_NOCHE.horaFin,
        franja: 'NOCHE',
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'SIN_TARIFA',
      });
    });

    it('los turnos no seleccionables no traen valor ni adelanto', async () => {
      prisma.reserva.findMany.mockResolvedValue([
        {
          canchaId: 1,
          horaInicio: TURNO_NOCHE.horaInicio,
          estado: 'CONFIRMADA',
        },
      ]);

      const { canchas } = await servicio.consultar({ fecha: HOY });

      expect(canchas[0].turnos[1]).not.toHaveProperty('valor');
      expect(canchas[0].turnos[1]).not.toHaveProperty('adelanto');
    });
  });

  describe('canchas', () => {
    it('solo consulta las canchas activas', async () => {
      await servicio.consultar({ fecha: HOY });

      expect(prisma.cancha.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activa: true }),
        }),
      );
    });

    it('filtra por la cancha pedida', async () => {
      await servicio.consultar({ fecha: HOY, canchaId: 7 });

      expect(prisma.cancha.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activa: true, id: 7 },
        }),
      );
    });

    it('sin filtro trae todas las canchas activas', async () => {
      await servicio.consultar({ fecha: HOY });

      expect(prisma.cancha.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activa: true } }),
      );
    });
  });

  describe('día cerrado', () => {
    it('devuelve abierto en false y las canchas sin turnos', async () => {
      turnos.generar.mockResolvedValue([]);

      const respuesta = await servicio.consultar({ fecha: HOY });

      expect(respuesta).toEqual({
        fecha: HOY,
        abierto: false,
        canchas: [
          {
            id: 1,
            nombre: 'Cancha 1',
            tamano: 'FUTBOL_7',
            iluminacion: true,
            turnos: [],
          },
        ],
      });
    });

    it('un día cerrado no consulta reservas ni tarifas', async () => {
      turnos.generar.mockResolvedValue([]);

      await servicio.consultar({ fecha: HOY });

      expect(prisma.reserva.findMany).not.toHaveBeenCalled();
      expect(prisma.tarifa.findMany).not.toHaveBeenCalled();
    });
  });
});
