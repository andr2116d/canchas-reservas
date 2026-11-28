import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { RELOJ } from '../../../src/compartido/aplicacion/reloj.port';
import { sumarAFecha } from '../../../src/compartido/dominio/momento-en-lima';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import { sesionDeRecepcionista } from '../../compartido/soporte/sesiones-de-prueba';
import { enLima } from '../fabricas/local-de-reservas';
import { MANANA, prepararElLocal, unJugadorMas } from '../fabricas/local-listo';

describe('Check-in de reserva', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let recepcion: string;
  let momento: Date;
  let fecha: string;
  let titularId: number;

  const api = () => request(app.getHttpServer());
  const cobrar = (codigo: string, pago: object = {}, cookie = recepcion) =>
    api()
      .post(`/api/recepcion/reservas/${codigo}/check-in`)
      .set('Cookie', cookie)
      .send(pago);
  const consultar = (codigo: string) =>
    api()
      .get(`/api/recepcion/reservas/${codigo}/check-in`)
      .set('Cookie', recepcion);
  const regla = (datos: object, cookie = local.administrador) =>
    api().put('/api/ventana-de-llegada').set('Cookie', cookie).send(datos);
  const agenda = (cookie = recepcion) =>
    api().get('/api/agenda').set('Cookie', cookie).query({ fecha }).expect(200);
  const fila = (codigo: string) =>
    prisma.reserva.findUniqueOrThrow({
      where: { codigo },
      include: { pagos: true },
    });
  const ahora = (hora: string) => {
    momento = enLima(fecha, hora);
  };

  async function reservar(
    cobro: object | undefined = { monto: '40.00', metodo: 'EFECTIVO' },
    canchaId = local.canchas[0].id,
  ) {
    const { body } = await api()
      .post('/api/recepcion/reservas')
      .set('Cookie', recepcion)
      .send({
        titularId,
        canchaId,
        fecha,
        desde: '19:00',
        precio: '80.00',
        adelanto: '40.00',
        cobro,
      })
      .expect(201);
    return String(body.codigo);
  }

  beforeEach(async () => {
    fecha = MANANA();
    ahora('18:27');
    ({ app, prisma } = await crearAppDePrueba((modulo) =>
      modulo.overrideProvider(RELOJ).useValue({ ahora: () => momento }),
    ));
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    recepcion = await sesionDeRecepcionista(app, local.administrador);
    await unJugadorMas(app, 1);
    titularId = (
      await prisma.usuario.findFirstOrThrow({ where: { rol: 'JUGADOR' } })
    ).id;
  });
  afterEach(() => app.close());

  it('ofrece el check-in a recepción durante la ventana, incluidos sus dos límites exactos', async () => {
    const codigo = await reservar();
    expect((await agenda()).body.turnos[0].acciones).not.toContain('CHECK_IN');
    expect((await consultar(codigo).expect(409)).body.message).toContain(
      'desde las 18:30',
    );
    ahora('18:30');
    expect((await agenda()).body.turnos[0].acciones).toContain('CHECK_IN');
    expect(
      (await agenda(local.administrador)).body.turnos[0].acciones,
    ).not.toContain('CHECK_IN');
    await consultar(codigo).expect(200);
    ahora('19:15');
    await prisma.sesion.updateMany({
      data: { ultimaActividadEn: momento, expiraEn: enLima(fecha, '20:00') },
    });
    await consultar(codigo).expect(200);
    momento = new Date(momento.getTime() + 1);
    expect((await agenda()).body.turnos[0].acciones).not.toContain('CHECK_IN');
    expect((await consultar(codigo).expect(409)).body.message).toContain(
      'ya terminó',
    );
  });

  it('versiona los valores enteros de 0 a 120 y conserva la regla de cada reserva', async () => {
    const inicial = await reservar();
    const datos = { minutosAntes: 0, minutosDespues: 120 };
    await regla(datos, recepcion).expect(403);
    await regla({ minutosAntes: 1.5, minutosDespues: 121 }).expect(400);
    expect((await regla(datos).expect(200)).body).toMatchObject({
      cambio: true,
      vigente: { ...datos, guardadaPor: expect.any(String) },
      historial: [expect.any(Object)],
    });
    expect((await regla(datos).expect(200)).body.cambio).toBe(false);
    const nueva = await reservar(undefined, local.canchas[1].id);
    expect((await fila(inicial)).ventanaDeLlegadaId).toBeNull();
    expect((await fila(nueva)).ventanaDeLlegadaId).toBeGreaterThan(0);
    ahora('18:30');
    await consultar(inicial).expect(200);
    expect((await consultar(nueva).expect(409)).body.message).toContain(
      'desde las 19:00',
    );
  });

  it('cobra el saldo exacto sobre el precio guardado y deja un registro importante', async () => {
    const codigo = await reservar({
      monto: '50.25',
      metodo: 'PLIN',
      numeroOperacion: 'A9817',
    });
    await local.guardar('put', '/api/tarifas/FUTBOL_5', {
      precioDia: '65',
      precioNoche: '120',
      duracionDelTurno: '1',
      ofreceTurnoCorto: false,
    });
    ahora('18:40');
    expect((await consultar(codigo).expect(200)).body).toMatchObject({
      precio: '80.00',
      pagado: '50.25',
      saldo: '29.75',
    });
    expect(
      (await cobrar(codigo, { metodo: 'EFECTIVO', monto: '0' }).expect(400))
        .body.errores.monto,
    ).toContain('29.75');
    expect(
      (await cobrar(codigo, { metodo: 'EFECTIVO', monto: '60' }).expect(400))
        .body.errores.monto,
    ).toContain('Corrige');
    await cobrar(codigo, { metodo: 'EFECTIVO', monto: '29.75' }).expect(200);
    const guardada = await fila(codigo);
    const saldo = guardada.pagos.find((pago) => pago.concepto === 'SALDO');
    expect(guardada).toMatchObject({
      estado: 'EN_JUEGO',
      checkInEn: enLima(fecha, '18:40'),
      checkInPorId: saldo?.registradoPorId,
    });
    expect(saldo).toMatchObject({
      metodo: 'EFECTIVO',
      numeroOperacion: null,
      registradoEn: guardada.checkInEn,
    });
    expect(saldo?.monto.toFixed(2)).toBe('29.75');
    const historial = await api()
      .get('/api/historial')
      .set('Cookie', local.administrador)
      .query({ categoria: 'RESERVAS', accion: 'CHECK_IN' })
      .expect(200);
    expect(historial.body.registros).toMatchObject([
      { importante: true, sujeto: `Reserva ${codigo}`, accion: 'CHECK_IN' },
    ]);
  });

  it('no cobra saldo cero, y un número de operación duplicado revierte todo el check-in', async () => {
    const pagada = await reservar({
      monto: '80.00',
      metodo: 'YAPE',
      numeroOperacion: 'PAGADO100',
    });
    const otra = await reservar(undefined, local.canchas[1].id);
    ahora('18:40');
    await cobrar(pagada).expect(200);
    expect((await fila(pagada)).pagos.map(({ concepto }) => concepto)).toEqual([
      'ADELANTO',
    ]);
    await cobrar(otra, { monto: '40.00', metodo: 'PLIN' }).expect(400);
    await cobrar(otra, {
      monto: '40.00',
      metodo: 'PLIN',
      numeroOperacion: 'pagado100',
    }).expect(409);
    expect(await fila(otra)).toMatchObject({
      estado: 'CONFIRMADA',
      checkInEn: null,
      checkInPorId: null,
      pagos: [{ concepto: 'ADELANTO' }],
    });
  });

  it('resuelve dos solicitudes simultáneas con un cobro y el mismo instante de registro', async () => {
    const codigo = await reservar();
    ahora('18:40');
    const pago = {
      monto: '40.00',
      metodo: 'PLIN',
      numeroOperacion: 'SALDO150',
    };
    const [a, b] = await Promise.all([
      cobrar(codigo, pago).expect(200),
      cobrar(codigo, pago).expect(200),
    ]);
    expect([a.body.tipo, b.body.tipo]).toEqual(
      expect.arrayContaining(['realizado', 'ya-realizado']),
    );
    expect(a.body.checkInEn).toBe(b.body.checkInEn);
    expect(
      (await fila(codigo)).pagos.filter(({ concepto }) => concepto === 'SALDO'),
    ).toHaveLength(1);
  });

  it('rechaza falta de sesión, roles ajenos, campos extra, otro día y cada estado sin check-in', async () => {
    const codigo = await reservar();
    const jugador = await unJugadorMas(app, 2);
    ahora('18:40');
    await api()
      .post(`/api/recepcion/reservas/${codigo}/check-in`)
      .send({})
      .expect(401);
    for (const cookie of [jugador, local.administrador])
      await cobrar(codigo, {}, cookie).expect(403);
    await cobrar(codigo, { checkInPorId: 77 }).expect(400);
    await consultar('codigo-invalido').expect(404);
    for (const estado of [
      'PENDIENTE_DE_PAGO',
      'PENDIENTE_DE_VALIDACION',
      'EXPIRADA',
      'EN_JUEGO',
      'CANCELADA',
      'AUSENTE',
      'FINALIZADA',
    ] as const) {
      await prisma.reserva.update({
        where: { codigo },
        data: {
          estado,
          venceEn:
            estado === 'PENDIENTE_DE_PAGO' ? enLima(fecha, '19:00') : null,
        },
      });
      expect((await cobrar(codigo).expect(409)).body.message).toMatch(
        /Solo se puede hacer check-in de una reserva confirmada/,
      );
    }
    const manana = sumarAFecha(fecha, { dias: 1 });
    await prisma.reserva.update({
      where: { codigo },
      data: {
        estado: 'CONFIRMADA',
        inicio: enLima(manana, '19:00'),
        fin: enLima(manana, '20:00'),
      },
    });
    expect((await cobrar(codigo).expect(409)).body.message).toContain(
      'reservas de hoy',
    );
  });
});
