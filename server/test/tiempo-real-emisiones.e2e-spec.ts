import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { origenCliente } from '../src/common/cors';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type { HorarioDia } from '../src/generated/prisma/client';
import { EVENTO_TURNOS_ACTUALIZADOS } from '../src/modules/tiempo-real/turnos.gateway';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const MANANA = '2030-01-15';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const ESPERA_MS = 3000;
const SILENCIO_MS = 1000;

const abierto = (diaSemana: number, cierre = '23:00') => ({
  diaSemana,
  abierto: true,
  apertura: '08:00',
  cierre,
});
const SEMANA = [1, 2, 3, 4, 5, 6, 7].map((dia) => abierto(dia));

describe('Emisiones de turnos en vivo (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let url: string;
  let admin: { id: number; cookie: string };
  let canchaId: number;
  let diasOriginales: HorarioDia[];
  let inicioNocheOriginal: string;
  const usuariosCreados: number[] = [];
  const canchasCreadas: number[] = [];
  const sockets: Socket[] = [];

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (rol: 'JUGADOR' | 'ADMINISTRADOR') => {
    const n = usuariosCreados.length + 1;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Tiempo real ${n}`,
        tipoDocumento: 'CE',
        numeroDocumento: `T${sufijo}${n}`,
        correo: `tiempo.real.${sufijo}.${n}@laprevia.test`,
        telefono: '900000090',
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const conectar = () => {
    const socket = io(url, {
      extraHeaders: { origin: origenCliente() },
      reconnection: false,
      forceNew: true,
    });
    sockets.push(socket);
    const recibidos: unknown[] = [];
    socket.on(EVENTO_TURNOS_ACTUALIZADOS, (payload: unknown) => {
      recibidos.push(payload);
    });
    return new Promise<{ socket: Socket; recibidos: unknown[] }>(
      (resolve, reject) => {
        socket.once('connect', () => resolve({ socket, recibidos }));
        socket.once('connect_error', reject);
      },
    );
  };

  const esperarEvento = (socket: Socket) =>
    new Promise<unknown>((resolve, reject) => {
      const limite = setTimeout(
        () => reject(new Error('No llegó turnos:actualizados')),
        ESPERA_MS,
      );
      socket.once(EVENTO_TURNOS_ACTUALIZADOS, (payload: unknown) => {
        clearTimeout(limite);
        resolve(payload);
      });
    });

  const esperar = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const reservar = (cookie: string, horaInicio: string) =>
    request(servidor())
      .post('/api/reservas')
      .set('Cookie', cookie)
      .send({ canchaId, fecha: MANANA, horaInicio, usarCredito: false });

  const definirTarifa = (valor: unknown) =>
    request(servidor())
      .put(`/api/canchas/${canchaId}/tarifas`)
      .set('Cookie', admin.cookie)
      .send({ franja: 'NOCHE', valor });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue({ ahora: () => AHORA })
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://localhost:${port}`;
    prisma = modulo.get(PrismaService);
    jwt = modulo.get(JwtService, { strict: false });

    diasOriginales = await prisma.horarioDia.findMany();
    inicioNocheOriginal = (
      await prisma.configuracion.findUniqueOrThrow({
        where: { id: 1 },
        select: { inicioNoche: true },
      })
    ).inicioNoche;
    for (const { diaSemana, ...dia } of SEMANA) {
      await prisma.horarioDia.upsert({
        where: { diaSemana },
        update: dia,
        create: { diaSemana, ...dia },
      });
    }
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { inicioNoche: '18:00' },
    });

    admin = await crearUsuario('ADMINISTRADOR');
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Tiempo real ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
    canchasCreadas.push(cancha.id);
    for (const [franja, valor] of [
      ['DIA', 60],
      ['NOCHE', 80],
    ] as const) {
      await prisma.tarifa.create({
        data: { canchaId, franja, valor, creadoPorId: admin.id },
      });
    }
  });

  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    const canchaIds = { in: canchasCreadas };
    await prisma.reserva.deleteMany({ where: { canchaId: canchaIds } });
    await prisma.tarifa.deleteMany({ where: { canchaId: canchaIds } });
    await prisma.cancha.deleteMany({ where: { id: canchaIds } });
    await prisma.usuario.deleteMany({
      where: { id: { in: usuariosCreados }, auditorias: { none: {} } },
    });

    for (const { diaSemana, abierto, apertura, cierre } of diasOriginales) {
      await prisma.horarioDia.update({
        where: { diaSemana },
        data: { abierto, apertura, cierre },
      });
    }
    await prisma.horarioDia.deleteMany({
      where: { diaSemana: { notIn: diasOriginales.map((d) => d.diaSemana) } },
    });
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { inicioNoche: inicioNocheOriginal },
    });
    await app.close();
  });

  describe('reservas', () => {
    let jugador: { id: number; cookie: string };
    let otro: { id: number; cookie: string };

    beforeAll(async () => {
      jugador = await crearUsuario('JUGADOR');
      otro = await crearUsuario('JUGADOR');
    });

    it('crear una reserva por HTTP emite su fecha y su cancha', async () => {
      const { socket } = await conectar();
      const recibido = esperarEvento(socket);

      await reservar(jugador.cookie, '18:00').expect(201);

      await expect(recibido).resolves.toEqual({ fecha: MANANA, canchaId });
    });

    it('repetir el mismo turno responde 409 y no emite nada', async () => {
      const { recibidos } = await conectar();

      await reservar(otro.cookie, '18:00').expect(409);
      await esperar(SILENCIO_MS);

      expect(recibidos).toEqual([]);
    });
  });

  describe('tarifas', () => {
    it('definir una tarifa emite la cancha para todas las fechas', async () => {
      const { socket } = await conectar();
      const recibido = esperarEvento(socket);

      await definirTarifa(95).expect(200);

      await expect(recibido).resolves.toEqual({ fecha: null, canchaId });
    });

    it('una tarifa inválida responde 400 y no emite nada', async () => {
      const { recibidos } = await conectar();

      await definirTarifa(-5).expect(400);
      await esperar(SILENCIO_MS);

      expect(recibidos).toEqual([]);
    });
  });

  describe('canchas', () => {
    it('editar una cancha emite la cancha para todas las fechas', async () => {
      const { socket } = await conectar();
      const recibido = esperarEvento(socket);

      await request(servidor())
        .patch(`/api/canchas/${canchaId}`)
        .set('Cookie', admin.cookie)
        .send({ nombre: `Tiempo real ${sufijo} editada` })
        .expect(200);

      await expect(recibido).resolves.toEqual({ fecha: null, canchaId });
    });
  });

  describe('horario', () => {
    it('guardar el horario emite el cambio para todas las fechas y canchas', async () => {
      const { socket } = await conectar();
      const recibido = esperarEvento(socket);

      await request(servidor())
        .put('/api/horario')
        .set('Cookie', admin.cookie)
        .send({
          dias: SEMANA.map((dia) =>
            dia.diaSemana === 7 ? abierto(7, '22:00') : dia,
          ),
          inicioNoche: '18:00',
          confirmar: true,
        })
        .expect(200);

      await expect(recibido).resolves.toEqual({ fecha: null, canchaId: null });
    });
  });
});
