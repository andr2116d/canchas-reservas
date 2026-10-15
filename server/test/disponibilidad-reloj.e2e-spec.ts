import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { instanteEnLima } from '../src/common/fechas-lima';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type { EstadoReserva } from '../src/generated/prisma/client';
import { type TurnoDisponibilidad } from '../src/modules/turnos/disponibilidad.service';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2031-03-10';
const MANANA = '2031-03-11';
/** 15:20 en Lima: el turno de las 15:00 ya pasó y el de las 16:00 no. */
const A_LAS_15_20 = instanteEnLima(HOY, '15:20');

class RelojFijo {
  instante = A_LAS_15_20;
  ahora() {
    return this.instante;
  }
}

interface Dia {
  diaSemana: number;
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
}

const SEMANA: Dia[] = [1, 2, 3, 4, 5, 6, 7].map((diaSemana) => ({
  diaSemana,
  abierto: true,
  apertura: '08:00',
  cierre: '23:00',
}));

describe('Disponibilidad con reloj fijo (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = new RelojFijo();

  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;
  let jugadorId: number;
  let principal: number;
  let sinNoche: number;
  let mantenimiento: number;
  let diasOriginales: Dia[];
  let inicioNocheOriginal: string | undefined;
  let codigos = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const consultar = (fecha: string) =>
    request(servidor())
      .get('/api/disponibilidad')
      .query({ fecha })
      .set('Cookie', cookie);

  const definirHorario = async (dias: Dia[], inicioNoche: string) => {
    for (const { diaSemana, ...dia } of dias) {
      await prisma.horarioDia.upsert({
        where: { diaSemana },
        update: dia,
        create: { diaSemana, ...dia },
      });
    }
    await prisma.configuracion.upsert({
      where: { id: 1 },
      update: { inicioNoche },
      create: { id: 1, inicioNoche },
    });
  };

  const crearCancha = async (nombre: string) =>
    (
      await prisma.cancha.create({
        data: {
          nombre: `Reloj ${sufijo} ${nombre}`,
          tamano: 'FUTBOL_5',
          iluminacion: true,
        },
        select: { id: true },
      })
    ).id;

  const ponerTarifa = (
    canchaId: number,
    franja: 'DIA' | 'NOCHE',
    valor: number,
  ) =>
    prisma.tarifa.create({
      data: {
        canchaId,
        franja,
        valor,
        vigenteDesde: new Date('2026-01-01T00:00:00.000Z'),
        creadoPorId: jugadorId,
      },
    });

  const crearReserva = (
    canchaId: number,
    fecha: string,
    horaInicio: string,
    estado: EstadoReserva,
  ) => {
    const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    return prisma.reserva.create({
      data: {
        codigo: `RL${sufijo}${++codigos}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        horaFin,
        inicioEn: instanteEnLima(fecha, horaInicio),
        finEn: instanteEnLima(fecha, horaFin),
        franja: horaInicio >= '18:00' ? 'NOCHE' : 'DIA',
        valorTurno: 60,
        adelantoMinimo: 30,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
  };

  type Respuesta = {
    body: { canchas: { id: number; turnos: TurnoDisponibilidad[] }[] };
  };
  const turno = (res: Respuesta, canchaId: number, hora: string) =>
    res.body.canchas
      .find((c) => c.id === canchaId)
      ?.turnos.find((t) => t.horaInicio === hora);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue(reloj)
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    const jwt = modulo.get(JwtService, { strict: false });

    diasOriginales = await prisma.horarioDia.findMany();
    inicioNocheOriginal = (
      await prisma.configuracion.findUnique({ where: { id: 1 } })
    )?.inicioNoche;

    const jugador = await prisma.usuario.create({
      data: {
        nombres: 'Reloj',
        tipoDocumento: 'CE',
        numeroDocumento: `RL${sufijo}`,
        correo: `reloj.disponibilidad.${sufijo}@laprevia.test`,
        telefono: `9004${sufijo.slice(-5)}`,
        passwordHash: 'sin-uso',
        rol: 'JUGADOR',
      },
      select: { id: true },
    });
    jugadorId = jugador.id;
    cookie = `sesion=${await jwt.signAsync(crearPayloadSesion(jugadorId, 'JUGADOR'))}`;

    principal = await crearCancha('Principal');
    sinNoche = await crearCancha('SinNoche');
    mantenimiento = await crearCancha('Mantenimiento');
    await ponerTarifa(principal, 'DIA', 60);
    await ponerTarifa(principal, 'NOCHE', 80);
    await ponerTarifa(sinNoche, 'DIA', 50);
    await ponerTarifa(mantenimiento, 'DIA', 70);
    await ponerTarifa(mantenimiento, 'NOCHE', 90);
    await prisma.cancha.update({
      where: { id: mantenimiento },
      data: { estado: 'EN_MANTENIMIENTO' },
    });
  });

  const canchas = () => [principal, sinNoche, mantenimiento];

  beforeEach(async () => {
    reloj.instante = A_LAS_15_20;
    await prisma.reserva.deleteMany({
      where: { canchaId: { in: canchas() } },
    });
    await definirHorario(SEMANA, '18:00');
  });

  afterAll(async () => {
    await prisma.reserva.deleteMany({
      where: { canchaId: { in: canchas() } },
    });
    await prisma.tarifa.deleteMany({ where: { canchaId: { in: canchas() } } });
    await prisma.cancha.deleteMany({ where: { id: { in: canchas() } } });
    await prisma.usuario.deleteMany({ where: { id: jugadorId } });
    await prisma.horarioDia.deleteMany({
      where: {
        diaSemana: { notIn: diasOriginales.map((dia) => dia.diaSemana) },
      },
    });
    await definirHorario(diasOriginales, inicioNocheOriginal ?? '18:00');
    if (inicioNocheOriginal === undefined) {
      await prisma.configuracion.deleteMany({ where: { id: 1 } });
    }
    await app.close();
  });

  describe('hora de inicio', () => {
    it('hoy a las 15:20 el turno de 15:00 sale con PASADO y el de 16:00 se puede elegir', async () => {
      const res = await consultar(HOY).expect(200);

      expect(turno(res, principal, '15:00')).toEqual({
        horaInicio: '15:00',
        horaFin: '16:00',
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'PASADO',
      });
      expect(turno(res, principal, '16:00')).toEqual({
        horaInicio: '16:00',
        horaFin: '17:00',
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 60,
        adelanto: 30,
      });
    });

    it('mañana a la misma hora ningún turno sale con PASADO', async () => {
      const res = await consultar(MANANA).expect(200);

      expect(turno(res, principal, '08:00')).toMatchObject({
        estado: 'DISPONIBLE',
        seleccionable: true,
      });
    });
  });

  describe('estados en una misma fecha', () => {
    it('muestra disponible, pendiente, ocupado y en mantenimiento a la vez', async () => {
      await crearReserva(principal, MANANA, '10:00', 'PENDIENTE_PAGO');
      await crearReserva(principal, MANANA, '11:00', 'CONFIRMADA');

      const res = await consultar(MANANA).expect(200);

      expect(turno(res, principal, '09:00')).toMatchObject({
        estado: 'DISPONIBLE',
        seleccionable: true,
      });
      expect(turno(res, principal, '10:00')).toMatchObject({
        estado: 'PENDIENTE',
        seleccionable: false,
      });
      expect(turno(res, principal, '11:00')).toMatchObject({
        estado: 'OCUPADO',
        seleccionable: false,
      });
      expect(turno(res, mantenimiento, '09:00')).toMatchObject({
        estado: 'EN_MANTENIMIENTO',
        seleccionable: false,
      });
    });

    it('el mantenimiento se impone a una reserva de la cancha', async () => {
      await crearReserva(mantenimiento, MANANA, '10:00', 'CONFIRMADA');
      await crearReserva(mantenimiento, MANANA, '11:00', 'PENDIENTE_PAGO');

      const res = await consultar(MANANA).expect(200);

      for (const hora of ['10:00', '11:00']) {
        expect(turno(res, mantenimiento, hora)).toMatchObject({
          estado: 'EN_MANTENIMIENTO',
          seleccionable: false,
        });
      }
    });

    it('una reserva en un turno que ya pasó sale con su estado y sin PASADO', async () => {
      await crearReserva(principal, HOY, '09:00', 'PENDIENTE_VALIDACION');
      await crearReserva(principal, HOY, '10:00', 'EN_JUEGO');

      const res = await consultar(HOY).expect(200);

      expect(turno(res, principal, '09:00')).toEqual({
        horaInicio: '09:00',
        horaFin: '10:00',
        franja: 'DIA',
        estado: 'PENDIENTE',
        seleccionable: false,
      });
      expect(turno(res, principal, '10:00')).toEqual({
        horaInicio: '10:00',
        horaFin: '11:00',
        franja: 'DIA',
        estado: 'OCUPADO',
        seleccionable: false,
      });
    });

    it('una reserva en un turno sin tarifa sale ocupada y sin SIN_TARIFA', async () => {
      await crearReserva(sinNoche, MANANA, '19:00', 'CONFIRMADA');

      const res = await consultar(MANANA).expect(200);

      expect(turno(res, sinNoche, '19:00')).toEqual({
        horaInicio: '19:00',
        horaFin: '20:00',
        franja: 'NOCHE',
        estado: 'OCUPADO',
        seleccionable: false,
      });
      expect(turno(res, sinNoche, '20:00')).toMatchObject({
        motivo: 'SIN_TARIFA',
      });
    });

    it.each(['EXPIRADA', 'AUSENTE'] as const)(
      'una reserva %s deja el turno disponible',
      async (estado) => {
        await crearReserva(principal, MANANA, '12:00', estado);

        const res = await consultar(MANANA).expect(200);

        expect(turno(res, principal, '12:00')).toEqual({
          horaInicio: '12:00',
          horaFin: '13:00',
          franja: 'DIA',
          estado: 'DISPONIBLE',
          seleccionable: true,
          valor: 60,
          adelanto: 30,
        });
      },
    );
  });
});
