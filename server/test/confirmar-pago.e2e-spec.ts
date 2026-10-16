import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type { EstadoReserva, Rol } from '../src/generated/prisma/client';
import { MENSAJES_CONFIRMAR_PAGO as MENSAJES_DTO } from '../src/modules/reservas/dto/confirmar-pago.dto';
import { MENSAJES_PAGO } from '../src/modules/reservas/pagos-reserva.service';
import { TurnosGateway } from '../src/modules/tiempo-real/turnos.gateway';
import { PrismaService } from '../src/prisma/prisma.service';

const DIA = '2031-04-15';
const AHORA = new Date(`${DIA}T10:00:00-05:00`);

describe('Confirmar pago desde recepción (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = { ahora: () => AHORA };
  const gateway = { notificar: jest.fn() };

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let recepcion: { id: number; cookie: string };
  let admin: { id: number; cookie: string };
  let jugador: { id: number; cookie: string };
  let canchaId: number;
  const usuariosCreados: number[] = [];
  let documentos = 0;
  let codigos = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (rol: Rol) => {
    documentos++;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Pago ${documentos}`,
        tipoDocumento: 'CE',
        numeroDocumento: `P${sufijo}${documentos}`,
        correo: `pago.${sufijo}.${documentos}@laprevia.test`,
        telefono: `98765432${documentos}`,
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const insertarReserva = async (
    horaInicio: string,
    estado: EstadoReserva = 'PENDIENTE_PAGO',
    fecha = DIA,
  ) => {
    codigos++;
    const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    const reserva = await prisma.reserva.create({
      data: {
        codigo: `CP${sufijo}${codigos}`,
        jugadorId: jugador.id,
        creadoPorId: jugador.id,
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        horaFin,
        inicioEn: new Date(`${fecha}T${horaInicio}:00-05:00`),
        finEn: new Date(`${fecha}T${horaFin}:00-05:00`),
        franja: horaInicio >= '18:00' ? 'NOCHE' : 'DIA',
        valorTurno: 80,
        adelantoMinimo: 40,
        estado,
        venceEn: new Date(`${fecha}T${horaInicio}:00-05:00`),
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
    return reserva.id;
  };

  const confirmar = (id: number | string, cuerpo: object, cookie?: string) => {
    const peticion = request(servidor())
      .post(`/api/agenda/${id}/confirmar-pago`)
      .send(cuerpo);
    return cookie ? peticion.set('Cookie', cookie) : peticion;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue(reloj)
      .overrideProvider(TurnosGateway)
      .useValue(gateway)
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.listen(0);
    prisma = modulo.get(PrismaService);
    jwt = modulo.get(JwtService, { strict: false });

    recepcion = await crearUsuario('RECEPCIONISTA');
    admin = await crearUsuario('ADMINISTRADOR');
    jugador = await crearUsuario('JUGADOR');
    const cancha = await prisma.cancha.create({
      data: { nombre: `Pago ${sufijo}`, tamano: 'FUTBOL_5', iluminacion: true },
    });
    canchaId = cancha.id;
  });

  beforeEach(() => gateway.notificar.mockClear());

  afterAll(async () => {
    await prisma.pago.deleteMany({ where: { reserva: { canchaId } } });
    await prisma.reserva.deleteMany({ where: { canchaId } });
    await prisma.cancha.delete({ where: { id: canchaId } });
    await prisma.usuario.deleteMany({
      where: { id: { in: usuariosCreados }, auditorias: { none: {} } },
    });
    await app.close();
  });

  it('el recepcionista confirma el adelanto y la reserva queda confirmada', async () => {
    const id = await insertarReserva('18:00');

    const { body } = await confirmar(
      id,
      { metodo: 'YAPE', numeroOperacion: '00123456' },
      recepcion.cookie,
    ).expect(201);

    expect(body).toEqual({
      id,
      codigo: `CP${sufijo}${codigos}`,
      estado: 'CONFIRMADA',
      adelantoPagado: 40,
      saldoPendiente: 40,
    });
    const reserva = await prisma.reserva.findUniqueOrThrow({ where: { id } });
    expect(reserva).toMatchObject({
      estado: 'CONFIRMADA',
      confirmadaEn: AHORA,
      venceEn: null,
    });
    const pagos = await prisma.pago.findMany({ where: { reservaId: id } });
    expect(pagos).toHaveLength(1);
    expect(pagos[0]).toMatchObject({
      concepto: 'ADELANTO',
      canal: 'RECEPCION',
      metodo: 'YAPE',
      estado: 'APROBADO',
      numeroOperacion: '00123456',
      registradoPorId: recepcion.id,
      validadoPorId: recepcion.id,
    });
    expect(Number(pagos[0].monto)).toBe(40);
    expect(gateway.notificar).toHaveBeenCalledWith(DIA, canchaId);
  });

  it('deja auditoría del cambio de estado', async () => {
    const id = await insertarReserva('19:00');
    await confirmar(id, { metodo: 'PLIN' }, recepcion.cookie).expect(201);

    const registros = await prisma.auditoria.findMany({
      where: { entidad: 'RESERVA', entidadId: id },
    });
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({
      usuarioId: recepcion.id,
      accion: 'CONFIRMAR_PAGO',
      detalle: {
        anterior: { estado: 'PENDIENTE_PAGO' },
        nuevo: { estado: 'CONFIRMADA' },
        metodo: 'PLIN',
        monto: 40,
      },
    });
  });

  it('con pago completo la reserva queda sin saldo y así la ven la agenda y el jugador', async () => {
    const id = await insertarReserva('20:00');
    await confirmar(
      id,
      { metodo: 'TRANSFERENCIA', pagoCompleto: true },
      admin.cookie,
    ).expect(201);

    const agenda = await request(servidor())
      .get('/api/agenda')
      .query({ fecha: DIA, canchaId })
      .set('Cookie', recepcion.cookie)
      .expect(200);
    expect(
      (agenda.body as { id: number }[]).find((t) => t.id === id),
    ).toMatchObject({
      estado: 'CONFIRMADA',
      adelantoPagado: 40,
      saldoPendiente: 0,
      acciones: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
    });

    const mias = await request(servidor())
      .get('/api/reservas/mias')
      .set('Cookie', jugador.cookie)
      .expect(200);
    expect(
      (mias.body as { id: number }[]).find((r) => r.id === id),
    ).toMatchObject({
      estado: 'CONFIRMADA',
      adelantoPagado: 40,
      saldoPendiente: 0,
    });
  });

  it('confirmar dos veces la misma reserva responde 409 y no duplica el pago', async () => {
    const id = await insertarReserva('21:00');
    const respuestas = await Promise.all([
      confirmar(id, { metodo: 'YAPE' }, recepcion.cookie),
      confirmar(id, { metodo: 'YAPE' }, recepcion.cookie),
    ]);

    expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      201, 409,
    ]);
    expect(respuestas.find((r) => r.status === 409)?.body).toEqual({
      statusCode: 409,
      message: MENSAJES_PAGO.estadoNoPermite,
      errores: {},
    });
    await expect(prisma.pago.count({ where: { reservaId: id } })).resolves.toBe(
      1,
    );
  });

  it.each<EstadoReserva>(['CONFIRMADA', 'CANCELADA', 'EXPIRADA'])(
    'una reserva %s responde 409',
    async (estado) => {
      const id = await insertarReserva('07:00', estado, '2031-04-16');
      await confirmar(id, { metodo: 'YAPE' }, recepcion.cookie).expect(409);
      await prisma.reserva.delete({ where: { id } });
    },
  );

  it('un turno que ya terminó responde 409', async () => {
    const id = await insertarReserva('08:00', 'PENDIENTE_PAGO', '2031-04-14');
    const { body } = await confirmar(
      id,
      { metodo: 'YAPE' },
      recepcion.cookie,
    ).expect(409);
    expect(body).toMatchObject({ message: MENSAJES_PAGO.turnoTerminado });
  });

  it('una reserva que no existe responde 404', async () => {
    await confirmar(2147483647, { metodo: 'YAPE' }, recepcion.cookie).expect(
      404,
    );
    await confirmar('abc', { metodo: 'YAPE' }, recepcion.cookie).expect(404);
  });

  it('valida el método y el número de operación con mensajes en español', async () => {
    const id = await insertarReserva('09:00');
    const { body } = await confirmar(
      id,
      { metodo: 'CREDITO', numeroOperacion: 'abc def' },
      recepcion.cookie,
    ).expect(400);
    expect(body).toEqual({
      statusCode: 400,
      message: MENSAJES_DTO.metodo,
      errores: {
        metodo: MENSAJES_DTO.metodo,
        numeroOperacion: MENSAJES_DTO.numeroOperacion,
      },
    });
  });

  it('sin sesión responde 401 y un jugador recibe 403', async () => {
    const id = await insertarReserva('10:00');
    await confirmar(id, { metodo: 'YAPE' }).expect(401);
    await confirmar(id, { metodo: 'YAPE' }, jugador.cookie).expect(403);
    await expect(
      prisma.reserva.findUniqueOrThrow({ where: { id } }),
    ).resolves.toMatchObject({ estado: 'PENDIENTE_PAGO' });
  });
});
