import type { NestExpressApplication } from '@nestjs/platform-express';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { ExpirarReservasVencidasUseCase } from '../../../src/modulos/reservas/aplicacion/expirar-reservas-vencidas.use-case';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  prepararElLocal,
  separarALas19,
  unJugadorMas,
} from '../fabricas/local-listo';

describe('Reservas que vencen sin pago', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let jugador: string;

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    jugador = await unJugadorMas(app, 1);
  });
  afterEach(() => app.close());

  const api = () => request(app.getHttpServer());
  const separar = (cookie: string, cambios: object = {}) =>
    api()
      .post('/api/reservas')
      .set('Cookie', cookie)
      .send(separarALas19(local.canchas[0].id, cambios))
      .expect(201)
      .then(({ body }) => body as { codigo: string });
  const vencer = (codigo: string) =>
    prisma.reserva.update({
      where: { codigo },
      data: { venceEn: new Date(Date.now() - 1000) },
    });
  const estadoDe = (codigo: string) =>
    prisma.reserva.findUniqueOrThrow({
      where: { codigo },
      select: { estado: true, expiradaEn: true },
    });
  const avisosDe = async (cookie: string) =>
    (await api().get('/api/avisos').set('Cookie', cookie).expect(200)).body
      .avisos as { tipo: string; referencia: string }[];
  const expirar = () => app.get(ExpirarReservasVencidasUseCase).ejecutar();

  it('la tarea corre cada minuto', () => {
    const tarea = app
      .get(SchedulerRegistry)
      .getCronJob('vencimientos-de-reservas');

    expect(tarea.cronTime.source).toBe(CronExpression.EVERY_MINUTE);
  });

  it('expira la reserva vencida, guarda cuándo y avisa a su titular', async () => {
    const { codigo } = await separar(jugador);
    await vencer(codigo);

    expect(await expirar()).toBe(1);

    expect(await estadoDe(codigo)).toMatchObject({
      estado: 'EXPIRADA',
      expiradaEn: expect.any(Date),
    });
    expect(await avisosDe(jugador)).toEqual([
      expect.objectContaining({ tipo: 'RESERVA_VENCIDA', referencia: codigo }),
    ]);
  });

  it('no toca la que aún no vence ni la que tiene el pago por validar', async () => {
    const { codigo: aTiempo } = await separar(jugador);
    const { codigo: porValidar } = await separar(jugador, { desde: '20:00' });
    await vencer(porValidar);
    await prisma.reserva.update({
      where: { codigo: porValidar },
      data: { estado: 'PENDIENTE_DE_VALIDACION' },
    });

    expect(await expirar()).toBe(0);

    expect((await estadoDe(aTiempo)).estado).toBe('PENDIENTE_DE_PAGO');
    expect((await estadoDe(porValidar)).estado).toBe('PENDIENTE_DE_VALIDACION');
  });

  it('una expirada queda expirada: correr la tarea otra vez no la cambia ni vuelve a avisar', async () => {
    const { codigo } = await separar(jugador);
    await vencer(codigo);
    await expirar();
    const antes = await estadoDe(codigo);

    expect(await expirar()).toBe(0);

    expect(await estadoDe(codigo)).toEqual(antes);
    expect(await avisosDe(jugador)).toHaveLength(1);
  });

  it('quien separa el turno de una reserva vencida la expira y su titular recibe el aviso', async () => {
    const { codigo } = await separar(jugador);
    await vencer(codigo);
    const otro = await unJugadorMas(app, 2);

    await separar(otro);

    expect((await estadoDe(codigo)).expiradaEn).not.toBeNull();
    expect(await avisosDe(jugador)).toEqual([
      expect.objectContaining({ tipo: 'RESERVA_VENCIDA', referencia: codigo }),
    ]);
  });

  it('cada reserva que vence entra al historial con el autor «Sistema»', async () => {
    const { codigo } = await separar(jugador);
    await vencer(codigo);
    await expirar();

    const { body } = await api()
      .get('/api/historial')
      .query({ categoria: 'RESERVAS', accion: 'EXPIRACION' })
      .set('Cookie', local.administrador)
      .expect(200);
    const { body: autores } = await api()
      .get('/api/historial/autores')
      .set('Cookie', local.administrador)
      .expect(200);

    expect(body.registros).toEqual([
      expect.objectContaining({
        autor: { id: null, nombre: 'Sistema' },
        sujeto: `Reserva ${codigo}`,
        importante: false,
      }),
    ]);
    expect(autores).toEqual([
      expect.objectContaining({ nombre: 'Valeria León Paredes' }),
    ]);
  });

  it('dos tareas a la vez expiran cada reserva una sola vez', async () => {
    const { codigo } = await separar(jugador);
    await vencer(codigo);

    const cantidades = await Promise.all([expirar(), expirar(), expirar()]);

    expect(cantidades.reduce((a, b) => a + b, 0)).toBe(1);
    expect(await avisosDe(jugador)).toHaveLength(1);
  });
});
