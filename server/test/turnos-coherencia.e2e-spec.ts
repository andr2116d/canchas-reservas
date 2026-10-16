import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { fechaEnLima, sumarDias } from '../src/common/fechas-lima';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type { Turno } from '../src/modules/turnos/generar-turnos';
import { TurnosService } from '../src/modules/turnos/turnos.service';
import { PrismaService } from '../src/prisma/prisma.service';

interface Dia {
  diaSemana: number;
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
}

const abierto = (diaSemana: number, apertura = '08:00', cierre = '23:00') => ({
  diaSemana,
  abierto: true,
  apertura,
  cierre,
});
const SEMANA: Dia[] = [1, 2, 3, 4, 5, 6, 7].map((dia) => abierto(dia));
const DIAS_EN_INGLES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const diaDeLaSemana = (fecha: string) =>
  DIAS_EN_INGLES.indexOf(
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(`${fecha}T12:00:00-05:00`)),
  ) + 1;

describe('Coherencia de la generación de turnos (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);

  let app: INestApplication;
  let prisma: PrismaService;
  let turnosService: TurnosService;
  let cookieAdmin: string;
  let cookieJugador: string;
  let jugadorId: number;
  let canchaId: number;
  let diasOriginales: Dia[];
  let inicioNocheOriginal: string | undefined;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const hoy = () => fechaEnLima(new Date());

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

  const crearUsuario = async (
    rol: 'ADMINISTRADOR' | 'JUGADOR',
    prefijo: string,
  ) =>
    (
      await prisma.usuario.create({
        data: {
          nombres: `Coherencia ${rol}`,
          tipoDocumento: 'CE',
          numeroDocumento: `${prefijo}${sufijo}`,
          correo: `coherencia.${prefijo.toLowerCase()}.${sufijo}@laprevia.test`,
          telefono: '900000046',
          passwordHash: 'sin-uso',
          rol,
        },
        select: { id: true },
      })
    ).id;

  const vistaPrevia = async (fecha: string): Promise<Turno[]> =>
    (
      await request(servidor())
        .get('/api/horario/vista-previa')
        .query({ fecha })
        .set('Cookie', cookieAdmin)
        .expect(200)
    ).body as Turno[];

  const disponibilidad = async (fecha: string): Promise<Turno[]> => {
    const res = await request(servidor())
      .get('/api/disponibilidad')
      .query({ fecha, canchaId })
      .set('Cookie', cookieJugador)
      .expect(200);
    const turnos = (res.body as { canchas: { turnos: Turno[] }[] }).canchas[0]
      .turnos;
    return turnos.map(({ horaInicio, horaFin, franja }) => ({
      horaInicio,
      horaFin,
      franja,
    }));
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    turnosService = modulo.get(TurnosService);
    const jwt = modulo.get(JwtService, { strict: false });

    diasOriginales = await prisma.horarioDia.findMany();
    inicioNocheOriginal = (
      await prisma.configuracion.findUnique({ where: { id: 1 } })
    )?.inicioNoche;

    const adminId = await crearUsuario('ADMINISTRADOR', 'CA');
    jugadorId = await crearUsuario('JUGADOR', 'CJ');
    cookieAdmin = `sesion=${await jwt.signAsync(crearPayloadSesion(adminId, 'ADMINISTRADOR'))}`;
    cookieJugador = `sesion=${await jwt.signAsync(crearPayloadSesion(jugadorId, 'JUGADOR'))}`;

    canchaId = (
      await prisma.cancha.create({
        data: {
          nombre: `Coherencia ${sufijo}`,
          tamano: 'FUTBOL_5',
          iluminacion: true,
        },
        select: { id: true },
      })
    ).id;
  });

  beforeEach(() => definirHorario(SEMANA, '18:00'));

  afterAll(async () => {
    try {
      await prisma.cancha.deleteMany({ where: { id: canchaId } });
      await prisma.usuario.deleteMany({ where: { id: jugadorId } });
    } finally {
      try {
        await prisma.horarioDia.deleteMany({
          where: {
            diaSemana: { notIn: diasOriginales.map((dia) => dia.diaSemana) },
          },
        });
        await definirHorario(diasOriginales, inicioNocheOriginal ?? '18:00');
        if (inicioNocheOriginal === undefined) {
          await prisma.configuracion.deleteMany({ where: { id: 1 } });
        }
      } finally {
        await app.close();
      }
    }
  });

  it('una fecha de cada día de la semana usa el horario de ese día', async () => {
    const horarioDe = (diaSemana: number) =>
      abierto(
        diaSemana,
        `${String(5 + diaSemana).padStart(2, '0')}:00`,
        '23:00',
      );
    await definirHorario([1, 2, 3, 4, 5, 6, 7].map(horarioDe), '18:00');

    const vistos = new Set<number>();
    for (let dias = 1; dias <= 7; dias++) {
      const fecha = sumarDias(hoy(), dias);
      const diaSemana = diaDeLaSemana(fecha);
      vistos.add(diaSemana);
      const apertura = horarioDe(diaSemana).apertura;

      expect([fecha, (await vistaPrevia(fecha))[0]?.horaInicio]).toEqual([
        fecha,
        apertura,
      ]);
      expect([fecha, (await disponibilidad(fecha))[0]?.horaInicio]).toEqual([
        fecha,
        apertura,
      ]);
    }
    expect([...vistos].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('para una misma fecha la vista previa, la disponibilidad y generar dan los mismos turnos', async () => {
    const fecha = sumarDias(hoy(), 3);
    await definirHorario(
      SEMANA.map((dia) =>
        dia.diaSemana === diaDeLaSemana(fecha)
          ? abierto(dia.diaSemana, '08:15', '23:15')
          : dia,
      ),
      '18:40',
    );

    const generados = await turnosService.generar(fecha);

    expect(generados).toHaveLength(14);
    expect(generados[0]).toEqual({
      horaInicio: '08:15',
      horaFin: '09:15',
      franja: 'DIA',
    });
    await expect(vistaPrevia(fecha)).resolves.toEqual(generados);
    await expect(disponibilidad(fecha)).resolves.toEqual(generados);
  });
});
