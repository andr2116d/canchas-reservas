import type { AddressInfo } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { fechaEnLima } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { RUTA_DEL_TIEMPO_REAL } from '../../../src/compartido/infraestructura/tiempo-real/ruta-del-tiempo-real';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  sesionDeAdministrador,
  sesionDeJugador,
} from '../../compartido/soporte/sesiones-de-prueba';
import { unaHojaValida } from '../../reclamos/fabricas/datos-de-hoja';

const PRIMERA = `000001-${fechaEnLima(new Date()).slice(0, 4)}`;

describe('avisos en la campana', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let administracion: string;
  const sockets: Socket[] = [];

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    administracion = await sesionDeAdministrador(app);
    await app.listen(0);
  });
  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.close());
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const avisosDe = async (cookie: string) =>
    (await api().get('/api/avisos').set('Cookie', cookie).expect(200)).body as {
      sinLeer: number;
      avisos: {
        id: number;
        tipo: string;
        referencia: string;
        leido: boolean;
      }[];
    };
  const registrar = (cookie?: string) => {
    const pedido = api().post('/api/libro-de-reclamaciones');
    if (cookie) pedido.set('Cookie', cookie);
    return pedido.send(unaHojaValida()).expect(201);
  };
  function conectar(cookie?: string): Socket {
    const { port } = app.getHttpServer().address() as AddressInfo;
    const socket = io(`http://localhost:${port}/avisos`, {
      path: RUTA_DEL_TIEMPO_REAL,
      addTrailingSlash: false,
      transports: ['websocket'],
      extraHeaders: cookie ? { cookie } : {},
    });
    sockets.push(socket);
    return socket;
  }

  it('sin sesión la campana responde 401', async () => {
    expect((await api().get('/api/avisos')).status).toBe(401);
  });

  it('una hoja nueva avisa a administración y no a un jugador', async () => {
    const jugador = await sesionDeJugador(app);

    await registrar();

    expect(await avisosDe(administracion)).toMatchObject({
      sinLeer: 1,
      avisos: [{ tipo: 'NUEVO_RECLAMO', referencia: PRIMERA, leido: false }],
    });
    expect((await avisosDe(jugador)).sinLeer).toBe(0);
  });

  it('el aviso llega al momento por el canal con sesión', async () => {
    const socket = conectar(administracion);
    await new Promise<void>((listo) => socket.once('connect', () => listo()));
    const llega = new Promise<void>((listo) =>
      socket.once('avisos', () => listo()),
    );

    await registrar();

    await expect(llega).resolves.toBeUndefined();
  });

  it('sin sesión válida el canal se cierra', async () => {
    const socket = conectar('sesion=no-existe');

    await expect(
      new Promise<string>((listo) =>
        socket.once('disconnect', (motivo) => listo(motivo)),
      ),
    ).resolves.toBe('io server disconnect');
  });

  it('el jugador recibe el aviso cuando responden la hoja que registró con su cuenta', async () => {
    const jugador = await sesionDeJugador(app);
    await registrar(jugador);

    await api()
      .post(`/api/reclamos/${PRIMERA}/respuesta`)
      .set('Cookie', administracion)
      .send({ texto: 'Devolvimos el adelanto.' })
      .expect(200);

    expect((await avisosDe(jugador)).avisos).toMatchObject([
      { tipo: 'RECLAMO_RESPONDIDO', referencia: PRIMERA },
    ]);
  });

  it('marca como leído un aviso propio o todos, pero no el de otra persona', async () => {
    const jugador = await sesionDeJugador(app);
    await registrar();
    const [aviso] = (await avisosDe(administracion)).avisos;

    const ajeno = await api()
      .post(`/api/avisos/${aviso.id}/lectura`)
      .set('Cookie', jugador);
    const invalido = await api()
      .post('/api/avisos/abc/lectura')
      .set('Cookie', administracion);
    const propio = await api()
      .post(`/api/avisos/${aviso.id}/lectura`)
      .set('Cookie', administracion);

    expect([ajeno.status, invalido.status, propio.status]).toEqual([
      404, 404, 204,
    ]);
    expect((await avisosDe(administracion)).sinLeer).toBe(0);
    await registrar();
    await api()
      .post('/api/avisos/lectura')
      .set('Cookie', administracion)
      .expect(204);
    expect((await avisosDe(administracion)).sinLeer).toBe(0);
  });
});
