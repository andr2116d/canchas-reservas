import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';
import { crearAppDePrueba } from '../../compartido/soporte/crear-app-de-prueba';
import { limpiarTablas } from '../../compartido/soporte/limpiar-tablas';
import {
  iniciarSesion,
  sesionDeRecepcionista,
} from '../../compartido/soporte/sesiones-de-prueba';
import { unJugadorValido } from '../../usuarios/fabricas/datos-registro-jugador';
import { MANANA, prepararElLocal, unJugadorMas } from '../fabricas/local-listo';

describe('Reservar en recepción', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let local: Awaited<ReturnType<typeof prepararElLocal>>;
  let recepcion: string;

  const cliente = {
    nombres: 'Ana',
    apellidos: 'Ramos Vega',
    tipoDocumento: 'DNI',
    numeroDocumento: '83417356',
    fechaNacimiento: '1993-05-14',
    celular: '921345678',
    versionDelAviso: '2026-11-24',
  };
  const api = () => request(app.getHttpServer());
  const alta = (cambios: object = {}) =>
    api()
      .post('/api/recepcion/clientes')
      .set('Cookie', recepcion)
      .send({ ...cliente, ...cambios });
  const reservar = (
    titularId: number,
    canchaId = local.canchas[0].id,
    cobro?: object,
  ) =>
    api()
      .post('/api/recepcion/reservas')
      .set('Cookie', recepcion)
      .send({
        titularId,
        canchaId,
        fecha: MANANA(),
        desde: '19:00',
        precio: '80.00',
        adelanto: '40.00',
        cobro,
      });

  beforeEach(async () => {
    ({ app, prisma } = await crearAppDePrueba());
    await limpiarTablas(prisma);
    local = await prepararElLocal(app);
    recepcion = await sesionDeRecepcionista(app, local.administrador);
  });
  afterEach(() => app.close());

  it('crea una sola cuenta de jugador sin acceso y guarda quién informó el aviso', async () => {
    const correo = 'ana.mostrador@example.test';
    const [a, b] = await Promise.all([
      alta({ correo }).expect(201),
      alta({ correo }).expect(201),
    ]);
    expect(a.body.cliente).toEqual(b.body.cliente);
    expect([a.body.existente, b.body.existente]).toEqual(expect.arrayContaining([false, true]));
    const cuenta = await prisma.usuario.findUniqueOrThrow({
      where: { id: Number(a.body.cliente.id) },
    });
    expect(cuenta).toMatchObject({
      contrasenaHash: null,
      rol: 'JUGADOR',
      canalAceptacionLegal: 'recepcion',
      versionLegalAceptada: cliente.versionDelAviso,
    });
    expect(cuenta.nombresCifrado).not.toBe(cliente.nombres);
    expect(cuenta.numeroDocumentoCifrado).not.toBe(cliente.numeroDocumento);
    expect(cuenta.aceptacionLegalEn).toBeInstanceOf(Date);
    expect(cuenta.avisoDePrivacidadInformadoPorId).toBe(
      (
        await prisma.usuario.findFirstOrThrow({
          where: { rol: 'RECEPCIONISTA' },
        })
      ).id,
    );
    const rechazo = await iniciarSesion(app, correo, 'definitiva2026').expect(
      401,
    );
    const inexistente = await iniciarSesion(
      app,
      'sin.cuenta@example.test',
      'definitiva2026',
    ).expect(401);
    expect(rechazo.body).toEqual(inexistente.body);
    expect(rechazo.headers['set-cookie']).toBeUndefined();
    await api()
      .post('/api/jugadores')
      .send(unJugadorValido({ numeroDocumento: cliente.numeroDocumento }))
      .expect(409);
  });

  it('encuentra cuentas previas por celular y exige aviso y mayoría de edad al dar de alta', async () => {
    await unJugadorMas(app, 1);
    await prisma.usuario.updateMany({
      where: { rol: 'JUGADOR' },
      data: { celularHash: null },
    });
    const { body } = await api()
      .post('/api/recepcion/clientes/buscar')
      .set('Cookie', recepcion)
      .send({ celular: '987654321' })
      .expect(200);
    expect(body).toEqual([
      {
        id: expect.any(Number),
        nombre: expect.any(String),
        tipoDocumento: 'DNI',
        numeroDocumento: '40000001',
      },
    ]);
    const rechazo = await alta({
      fechaNacimiento: MANANA(),
      versionDelAviso: '',
    }).expect(400);
    expect(rechazo.body.errores).toMatchObject({
      fechaNacimiento: expect.any(String),
      versionDelAviso: expect.any(String),
    });
  });

  it('registra un solo pago al disputar el turno y nunca deja una reserva tras una operación duplicada', async () => {
    const { body } = await alta().expect(201);
    const titular = Number(body.cliente.id);
    const cobro = { monto: '40.00', metodo: 'YAPE', numeroOperacion: 'ABC125' };
    const respuestas = await Promise.all([
      reservar(titular, undefined, cobro),
      reservar(titular, undefined, cobro),
    ]);
    expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409]);
    const aceptada = respuestas.find((r) => r.status === 201)!;
    const otra = await reservar(titular, local.canchas[1].id, {
      ...cobro,
      numeroOperacion: ' abc125 ',
    }).expect(409);
    expect(otra.body.errores.numeroOperacion).toContain(aceptada.body.codigo);
    const reserva = await prisma.reserva.findUniqueOrThrow({
      where: { codigo: String(aceptada.body.codigo) },
      include: { pagos: true },
    });
    expect(reserva).toMatchObject({
      canal: 'RECEPCION',
      estado: 'CONFIRMADA',
      venceEn: null,
      titularId: titular,
      pagos: [
        {
          concepto: 'ADELANTO',
          metodo: 'YAPE',
          numeroOperacion: 'ABC125',
          registradoPorId: reserva.creadaPorId,
        },
      ],
    });
    expect(reserva.pagos[0].monto.toFixed(2)).toBe('40.00');
    expect(await prisma.reserva.count()).toBe(1);
    const agenda = await api()
      .get('/api/agenda')
      .query({ fecha: MANANA() })
      .set('Cookie', recepcion)
      .expect(200);
    expect(agenda.body.turnos).toMatchObject([
      { codigo: aceptada.body.codigo, pagado: '40.00', saldo: '40.00' },
    ]);
  });

  it('deniega el flujo sin permiso y valida los campos antes de cobrar', async () => {
    const jugador = await unJugadorMas(app, 1);
    await api()
      .post('/api/recepcion/clientes/buscar')
      .send({ celular: cliente.celular })
      .expect(401);
    for (const cookie of [jugador, local.administrador])
      await api()
        .post('/api/recepcion/clientes/buscar')
        .set('Cookie', cookie)
        .send({ celular: cliente.celular })
        .expect(403);
    await alta({ rol: 'ADMINISTRADOR' }).expect(400);
    const { body } = await alta().expect(201);
    const { body: errores } = await reservar(
      Number(body.cliente.id),
      undefined,
      { monto: '39.99', metodo: 'PLIN' },
    ).expect(400);
    expect(errores).toMatchObject({
      statusCode: 400,
      message: expect.any(String),
      errores: {
        monto: 'El adelanto mínimo es S/ 40.00.',
        numeroOperacion: 'Ingresa el número de operación.',
      },
    });
    expect(await prisma.pago.count()).toBe(0);
    await reservar(Number(body.cliente.id)).expect(400);
    expect(await prisma.reserva.count()).toBe(0);
  });
});
