import { BadRequestException, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import { ReservasService } from '../src/modules/reservas/reservas.service';
import type { EstadoReserva, HorarioDia } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const MANANA = '2030-01-15';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const NO_DISPONIBLE = 'El turno ya no está disponible';

class RelojFijo {
  instante = AHORA;
  ahora() {
    return this.instante;
  }
}

interface Resumen {
  cancha: { id: number; nombre: string; tamano: string };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  franja: string;
  valorTurno: number;
  adelanto: number;
  saldo: number;
  creditoDisponible: number;
  soloConCredito: boolean;
  minutosParaPagar: number;
  regla: {
    horasAnticipacion: number;
    tipoCompensacion: string;
    plazoLimite: string;
    plazoVencido: boolean;
  };
}

interface Creada {
  id: number;
  codigo: string;
  estado: string;
  venceEn: string | null;
}

describe('Reservas (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = new RelojFijo();

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminId: number;
  let diasOriginales: HorarioDia[];
  let configuracionOriginal: {
    inicioNoche: string;
    tiempoLimitePagoMin: number;
  };
  let reglaOriginal: {
    horasAnticipacion: number;
    tipoCompensacion: 'DEVOLUCION' | 'CREDITO';
  };
  const usuariosCreados: number[] = [];
  const canchasCreadas: number[] = [];
  let documentos = 0;
  let codigos = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (rol: 'JUGADOR' | 'ADMINISTRADOR' = 'JUGADOR') => {
    documentos++;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Reserva ${documentos}`,
        tipoDocumento: 'CE',
        numeroDocumento: `R${sufijo}${documentos}`,
        correo: `reservas.${sufijo}.${documentos}@laprevia.test`,
        telefono: '900000070',
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const crearCancha = async (
    tarifas: { DIA?: number; NOCHE?: number } = { DIA: 60, NOCHE: 80 },
    datos: { activa?: boolean; estado?: 'OPERATIVA' | 'EN_MANTENIMIENTO' } = {},
  ) => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Reservas ${sufijo} ${canchasCreadas.length + 1}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
        ...datos,
      },
    });
    canchasCreadas.push(cancha.id);
    for (const [franja, valor] of Object.entries(tarifas)) {
      await prisma.tarifa.create({
        data: {
          canchaId: cancha.id,
          franja: franja as 'DIA' | 'NOCHE',
          valor,
          creadoPorId: adminId,
        },
      });
    }
    return cancha.id;
  };

  const insertarReserva = (
    jugadorId: number,
    canchaId: number,
    fecha: string,
    horaInicio: string,
    estado: EstadoReserva,
  ) => {
    codigos++;
    const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:${horaInicio.slice(3)}`;
    return prisma.reserva.create({
      data: {
        codigo: `E${sufijo}${codigos}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        horaFin,
        inicioEn: new Date(`${fecha}T${horaInicio}:00-05:00`),
        finEn: new Date(`${fecha}T${horaFin}:00-05:00`),
        franja: 'NOCHE',
        valorTurno: 80,
        adelantoMinimo: 40,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
  };

  const reservar = (
    cookie: string,
    datos: { canchaId: number; fecha: string; horaInicio: string },
  ) =>
    request(servidor())
      .post('/api/reservas')
      .set('Cookie', cookie)
      .send({ ...datos, usarCredito: false });

  const resumen = (
    cookie: string,
    datos: { canchaId: number; fecha: string; horaInicio: string },
  ) =>
    request(servidor())
      .get('/api/reservas/resumen')
      .query(datos)
      .set('Cookie', cookie);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue(reloj)
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.listen(0);
    prisma = modulo.get(PrismaService);
    jwt = modulo.get(JwtService, { strict: false });
    adminId = (await crearUsuario('ADMINISTRADOR')).id;

    diasOriginales = await prisma.horarioDia.findMany();
    configuracionOriginal = await prisma.configuracion.findUniqueOrThrow({
      where: { id: 1 },
      select: { inicioNoche: true, tiempoLimitePagoMin: true },
    });
    reglaOriginal = await prisma.reglaCancelacion.findUniqueOrThrow({
      where: { id: 1 },
      select: { horasAnticipacion: true, tipoCompensacion: true },
    });

    for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
      const dia = { abierto: true, apertura: '08:00', cierre: '23:00' };
      await prisma.horarioDia.upsert({
        where: { diaSemana },
        update: dia,
        create: { diaSemana, ...dia },
      });
    }
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { inicioNoche: '18:00', tiempoLimitePagoMin: 15 },
    });
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' },
    });
  });

  beforeEach(() => {
    reloj.instante = AHORA;
  });

  afterAll(async () => {
    const canchaId = { in: canchasCreadas };
    const usuarioId = { in: usuariosCreados };
    await prisma.creditoUso.deleteMany({
      where: { pago: { reserva: { canchaId } } },
    });
    await prisma.pago.deleteMany({ where: { reserva: { canchaId } } });
    await prisma.reserva.deleteMany({ where: { canchaId } });
    await prisma.tarifa.deleteMany({ where: { canchaId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await prisma.credito.deleteMany({ where: { jugadorId: usuarioId } });
    await prisma.usuario.deleteMany({
      where: { id: usuarioId, auditorias: { none: {} } },
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
      data: configuracionOriginal,
    });
    await prisma.reglaCancelacion.update({
      where: { id: 1 },
      data: reglaOriginal,
    });
    await app.close();
  });

  describe('reserva válida', () => {
    let jugador: { id: number; cookie: string };
    let canchaId: number;

    beforeAll(async () => {
      jugador = await crearUsuario();
      canchaId = await crearCancha();
    });

    it('el resumen muestra montos, tiempo para pagar y la regla', async () => {
      await prisma.credito.create({
        data: { jugadorId: jugador.id, monto: 15, saldo: 12.5 },
      });
      await prisma.credito.create({
        data: { jugadorId: jugador.id, monto: 10, saldo: 0 },
      });
      const res = await resumen(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(200);
      expect(res.body).toEqual({
        cancha: {
          id: canchaId,
          nombre: expect.any(String) as string,
          tamano: 'FUTBOL_5',
        },
        fecha: MANANA,
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        valorTurno: 80,
        adelanto: 40,
        saldo: 40,
        creditoDisponible: 12.5,
        soloConCredito: false,
        minutosParaPagar: 15,
        regla: {
          horasAnticipacion: 24,
          tipoCompensacion: 'CREDITO',
          plazoLimite: new Date(`${HOY}T18:00:00-05:00`).toISOString(),
          plazoVencido: false,
        },
      } satisfies Resumen);
      expect(await prisma.reserva.count({ where: { canchaId } })).toBe(0);
    });

    it('el resumen marca vencido el plazo que ya pasó según el reloj', async () => {
      reloj.instante = new Date(`${HOY}T10:30:00-05:00`);
      const res = await resumen(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '08:00',
      }).expect(200);
      expect((res.body as Resumen).regla).toEqual({
        horasAnticipacion: 24,
        tipoCompensacion: 'CREDITO',
        plazoLimite: new Date(`${HOY}T08:00:00-05:00`).toISOString(),
        plazoVencido: true,
      });
    });

    it('crea la reserva pendiente con montos, vencimiento, código y regla', async () => {
      const res = await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      expect(creada).toEqual({
        id: expect.any(Number) as number,
        codigo: expect.stringMatching(/^[A-Z0-9]{8}$/) as string,
        estado: 'PENDIENTE_PAGO',
        venceEn: new Date(AHORA.getTime() + 15 * 60 * 1000).toISOString(),
      });

      const guardada = await prisma.reserva.findUniqueOrThrow({
        where: { id: creada.id },
      });
      expect(guardada).toMatchObject({
        codigo: creada.codigo,
        jugadorId: jugador.id,
        creadoPorId: jugador.id,
        origen: 'PLATAFORMA',
        canchaId,
        fecha: new Date(`${MANANA}T00:00:00.000Z`),
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        inicioEn: new Date(`${MANANA}T18:00:00-05:00`),
        finEn: new Date(`${MANANA}T19:00:00-05:00`),
        estado: 'PENDIENTE_PAGO',
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
        creadoEn: AHORA,
      });
      expect(guardada.valorTurno.toFixed(2)).toBe('80.00');
      expect(guardada.adelantoMinimo.toFixed(2)).toBe('40.00');
    });

    it('los montos guardados no cambian si cambia la tarifa', async () => {
      const res = await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '10:00',
      }).expect(201);
      await prisma.tarifa.updateMany({
        where: { canchaId, franja: 'DIA', vigenteHasta: null },
        data: { valor: 99 },
      });
      const guardada = await prisma.reserva.findUniqueOrThrow({
        where: { id: (res.body as Creada).id },
      });
      expect(guardada.valorTurno.toFixed(2)).toBe('60.00');
      expect(guardada.adelantoMinimo.toFixed(2)).toBe('30.00');
    });

    it('con un turno a 10 minutos vence en el inicio del turno', async () => {
      const otro = await crearUsuario();
      reloj.instante = new Date(`${HOY}T17:50:00-05:00`);
      const datos = { canchaId, fecha: HOY, horaInicio: '18:00' };

      const res = await resumen(otro.cookie, datos).expect(200);
      expect((res.body as Resumen).minutosParaPagar).toBe(10);

      const creada = await reservar(otro.cookie, datos).expect(201);
      expect((creada.body as Creada).venceEn).toBe(
        new Date(`${HOY}T18:00:00-05:00`).toISOString(),
      );
    });

    it('la copia de la regla no cambia si cambia la regla vigente', async () => {
      const otro = await crearUsuario();
      const res = await reservar(otro.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '20:00',
      }).expect(201);
      const reglaAntes = await prisma.reglaCancelacion.findUniqueOrThrow({
        where: { id: 1 },
        select: { horasAnticipacion: true, tipoCompensacion: true },
      });
      await prisma.reglaCancelacion.update({
        where: { id: 1 },
        data: { horasAnticipacion: 6, tipoCompensacion: 'DEVOLUCION' },
      });
      try {
        const guardada = await prisma.reserva.findUniqueOrThrow({
          where: { id: (res.body as Creada).id },
        });
        expect(guardada).toMatchObject({
          reglaHorasAnticipacion: 24,
          reglaTipoCompensacion: 'CREDITO',
        });
        const nueva = await reservar(otro.cookie, {
          canchaId,
          fecha: MANANA,
          horaInicio: '21:00',
        }).expect(201);
        await expect(
          prisma.reserva.findUniqueOrThrow({
            where: { id: (nueva.body as Creada).id },
          }),
        ).resolves.toMatchObject({
          reglaHorasAnticipacion: 6,
          reglaTipoCompensacion: 'DEVOLUCION',
        });
      } finally {
        await prisma.reglaCancelacion.update({
          where: { id: 1 },
          data: reglaAntes,
        });
      }
    });
  });

  describe('motivos de rechazo', () => {
    let jugador: { id: number; cookie: string };
    let otro: { id: number; cookie: string };
    let canchaId: number;

    beforeAll(async () => {
      jugador = await crearUsuario();
      otro = await crearUsuario();
      canchaId = await crearCancha();
    });

    const mismoRechazo = async (
      datos: { canchaId: number; fecha: string; horaInicio: string },
      status: number,
      message: string,
    ) => {
      const consulta = await resumen(jugador.cookie, datos).expect(status);
      expect(consulta.body).toMatchObject({ statusCode: status, message });
      const creacion = await reservar(jugador.cookie, datos).expect(status);
      expect(creacion.body).toMatchObject({ statusCode: status, message });
      return creacion.body as { errores: Record<string, string> };
    };

    it('sin sesión responde 401 y otro rol responde 403', async () => {
      const datos = { canchaId, fecha: MANANA, horaInicio: '18:00' };
      await request(servidor()).post('/api/reservas').send(datos).expect(401);
      const admin = await crearUsuario('ADMINISTRADOR');
      await reservar(admin.cookie, datos).expect(403);
      await resumen(admin.cookie, datos).expect(403);
    });

    it('un jugador inactivo no puede reservar', async () => {
      const inactivo = await crearUsuario();
      await prisma.usuario.update({
        where: { id: inactivo.id },
        data: { estado: 'INACTIVO' },
      });
      const datos = { canchaId, fecha: MANANA, horaInicio: '18:00' };
      await reservar(inactivo.cookie, datos).expect(401);

      const reservas = app.get(ReservasService);
      const error = (await reservas
        .crear(inactivo.id, { ...datos, usarCredito: false })
        .catch((e: unknown) => e)) as BadRequestException;
      expect(error.getResponse()).toMatchObject({
        statusCode: 400,
        message: 'Solo un jugador activo puede reservar',
      });
    });

    it.each([
      ['de ayer', '2030-01-13', '18:00'],
      ['de hoy que ya empezó', HOY, '09:00'],
      ['de hoy que empieza ahora', HOY, '10:00'],
    ])('un turno %s ya pasó', async (_caso, fecha, horaInicio) => {
      const body = await mismoRechazo(
        { canchaId, fecha, horaInicio },
        400,
        'El turno ya pasó',
      );
      expect(body.errores).toEqual({ horaInicio: 'El turno ya pasó' });
    });

    it('acepta hasta hoy + 30 días y rechaza hoy + 31', async () => {
      await resumen(jugador.cookie, {
        canchaId,
        fecha: '2030-02-13',
        horaInicio: '18:00',
      }).expect(200);
      await resumen(jugador.cookie, {
        canchaId,
        fecha: HOY,
        horaInicio: '11:00',
      }).expect(200);
      await mismoRechazo(
        { canchaId, fecha: '2030-02-14', horaInicio: '18:00' },
        400,
        'Solo puedes reservar desde hoy hasta dentro de 30 días',
      );
    });

    it('la cancha no existe', async () => {
      await mismoRechazo(
        { canchaId: 2147483647, fecha: MANANA, horaInicio: '18:00' },
        400,
        'No se encontró la cancha',
      );
    });

    it('la cancha está desactivada', async () => {
      const desactivada = await crearCancha(undefined, { activa: false });
      await mismoRechazo(
        { canchaId: desactivada, fecha: MANANA, horaInicio: '18:00' },
        400,
        'La cancha está desactivada',
      );
    });

    it('la cancha está en mantenimiento', async () => {
      const enMantenimiento = await crearCancha(undefined, {
        estado: 'EN_MANTENIMIENTO',
      });
      await mismoRechazo(
        { canchaId: enMantenimiento, fecha: MANANA, horaInicio: '18:00' },
        400,
        'La cancha está en mantenimiento',
      );
    });

    it.each(['07:00', '23:00', '18:30'])(
      'el turno de las %s está fuera del horario operativo',
      async (horaInicio) => {
        await mismoRechazo(
          { canchaId, fecha: MANANA, horaInicio },
          400,
          'El turno está fuera del horario operativo',
        );
      },
    );

    it('la cancha no tiene tarifa para la franja del turno', async () => {
      const soloDia = await crearCancha({ DIA: 60 });
      await resumen(jugador.cookie, {
        canchaId: soloDia,
        fecha: MANANA,
        horaInicio: '10:00',
      }).expect(200);
      await mismoRechazo(
        { canchaId: soloDia, fecha: MANANA, horaInicio: '18:00' },
        400,
        'La cancha no tiene tarifa para esa franja',
      );
    });

    it.each<EstadoReserva>([
      'PENDIENTE_PAGO',
      'PENDIENTE_VALIDACION',
      'CONFIRMADA',
    ])('el turno con una reserva %s no está disponible', async (estado) => {
      const cancha = await crearCancha();
      await insertarReserva(otro.id, cancha, MANANA, '19:00', estado);
      await mismoRechazo(
        { canchaId: cancha, fecha: MANANA, horaInicio: '19:00' },
        409,
        NO_DISPONIBLE,
      );
    });

    it.each<EstadoReserva>(['CANCELADA', 'EXPIRADA'])(
      'el turno con una reserva %s se puede volver a reservar',
      async (estado) => {
        const cancha = await crearCancha();
        await insertarReserva(otro.id, cancha, MANANA, '19:00', estado);
        const nuevo = await crearUsuario();
        await reservar(nuevo.cookie, {
          canchaId: cancha,
          fecha: MANANA,
          horaInicio: '19:00',
        }).expect(201);
      },
    );

    it('datos con formato inválido responden 400 por campo', async () => {
      const res = await request(servidor())
        .post('/api/reservas')
        .set('Cookie', jugador.cookie)
        .send({ canchaId: 'x', fecha: '2030-02-30', horaInicio: '18' })
        .expect(400);
      expect((res.body as { errores: Record<string, string> }).errores).toEqual(
        {
          canchaId: 'Elige una cancha válida',
          fecha: 'La fecha debe tener el formato YYYY-MM-DD',
          horaInicio: 'La hora debe tener el formato HH:mm, de 00:00 a 23:59',
          usarCredito: 'Indica si quieres usar tu crédito',
        },
      );
    });
  });

  describe('límite de pendientes y auditoría', () => {
    it('la tercera reserva pendiente responde 409', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha();
      for (const horaInicio of ['18:00', '19:00']) {
        await reservar(jugador.cookie, {
          canchaId,
          fecha: MANANA,
          horaInicio,
        }).expect(201);
      }
      const datos = { canchaId, fecha: MANANA, horaInicio: '20:00' };
      const mensaje = 'Ya tienes 2 reservas pendientes de pago';
      const consulta = await resumen(jugador.cookie, datos).expect(409);
      expect(consulta.body).toMatchObject({
        statusCode: 409,
        message: mensaje,
      });
      const res = await reservar(jugador.cookie, datos).expect(409);
      expect(res.body).toEqual({
        statusCode: 409,
        message: mensaje,
        errores: {},
      });
      expect(
        await prisma.reserva.count({
          where: { jugadorId: jugador.id, estado: 'PENDIENTE_PAGO' },
        }),
      ).toBe(2);
    });

    it('las reservas confirmadas no cuentan para el límite', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha();
      await insertarReserva(
        jugador.id,
        canchaId,
        MANANA,
        '18:00',
        'CONFIRMADA',
      );
      await insertarReserva(
        jugador.id,
        canchaId,
        MANANA,
        '19:00',
        'PENDIENTE_PAGO',
      );
      await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '20:00',
      }).expect(201);
    });

    it('la creación queda en auditoría con el usuario', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha();
      const res = await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      const registros = await prisma.auditoria.findMany({
        where: { entidad: 'RESERVA', entidadId: creada.id },
      });
      expect(registros).toHaveLength(1);
      expect(registros[0]).toMatchObject({
        usuarioId: jugador.id,
        accion: 'CREAR',
        entidad: 'RESERVA',
        detalle: {
          codigo: creada.codigo,
          canchaId,
          fecha: MANANA,
          horaInicio: '18:00',
          valorTurno: 80,
          adelantoMinimo: 40,
        },
      });
    });

    it('un rechazo no deja reserva ni auditoría', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 60 });
      await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(400);
      expect(await prisma.reserva.count({ where: { canchaId } })).toBe(0);
      expect(
        await prisma.auditoria.count({
          where: { usuarioId: jugador.id, entidad: 'RESERVA' },
        }),
      ).toBe(0);
    });
  });

  describe('turno solapado', () => {
    const activasEn = (canchaId: number) =>
      prisma.reserva.count({
        where: {
          canchaId,
          estado: {
            in: [
              'PENDIENTE_PAGO',
              'PENDIENTE_VALIDACION',
              'CONFIRMADA',
              'EN_JUEGO',
              'FINALIZADA',
            ],
          },
        },
      });

    it('una reserva de 08:15 a 09:15 deja sin reservar los turnos de 08:00 y de 09:00', async () => {
      const jugador = await crearUsuario();
      const otro = await crearUsuario();
      const canchaId = await crearCancha();
      await insertarReserva(otro.id, canchaId, MANANA, '08:15', 'CONFIRMADA');

      for (const horaInicio of ['08:00', '09:00']) {
        const datos = { canchaId, fecha: MANANA, horaInicio };
        const previa = await resumen(jugador.cookie, datos);
        expect(previa.status).toBe(409);
        expect(previa.body).toMatchObject({
          statusCode: 409,
          message: NO_DISPONIBLE,
          errores: { horaInicio: NO_DISPONIBLE },
        });
        const creada = await reservar(jugador.cookie, datos);
        expect(creada.status).toBe(409);
        expect(creada.body).toMatchObject({ message: NO_DISPONIBLE });
      }
      expect(await activasEn(canchaId)).toBe(1);
    });

    it('el turno siguiente al solapado se puede reservar', async () => {
      const jugador = await crearUsuario();
      const otro = await crearUsuario();
      const canchaId = await crearCancha();
      await insertarReserva(otro.id, canchaId, MANANA, '08:15', 'CONFIRMADA');

      const creada = await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '10:00',
      });

      expect(creada.status).toBe(201);
      expect(await activasEn(canchaId)).toBe(2);
    });

    it('una reserva en juego bloquea el turno siguiente con el que se solapa', async () => {
      reloj.instante = new Date(`${HOY}T08:30:00-05:00`);
      const jugador = await crearUsuario();
      const otro = await crearUsuario();
      const canchaId = await crearCancha();
      await insertarReserva(otro.id, canchaId, HOY, '08:15', 'EN_JUEGO');
      const datos = { canchaId, fecha: HOY, horaInicio: '09:00' };

      const previa = await resumen(jugador.cookie, datos);
      expect(previa.status).toBe(409);
      expect(previa.body).toMatchObject({ message: NO_DISPONIBLE });
      const creada = await reservar(jugador.cookie, datos);
      expect(creada.status).toBe(409);
      expect(creada.body).toMatchObject({ message: NO_DISPONIBLE });
      expect(await activasEn(canchaId)).toBe(1);
    });
  });

  describe('concurrencia', () => {
    it('de 50 solicitudes simultáneas al mismo turno solo una se crea', async () => {
      const canchaId = await crearCancha();
      const jugadores = [];
      for (let i = 0; i < 50; i++) jugadores.push(await crearUsuario());
      const datos = { canchaId, fecha: MANANA, horaInicio: '18:00' };

      const respuestas = await Promise.all(
        jugadores.map((j) => reservar(j.cookie, datos)),
      );

      const creadas = respuestas.filter((r) => r.status === 201);
      const rechazadas = respuestas.filter((r) => r.status === 409);
      expect(creadas).toHaveLength(1);
      expect(rechazadas).toHaveLength(49);
      for (const r of rechazadas) {
        expect(r.body).toMatchObject({
          statusCode: 409,
          message: NO_DISPONIBLE,
        });
      }
      expect(
        await prisma.reserva.count({
          where: {
            canchaId,
            fecha: new Date(`${MANANA}T00:00:00.000Z`),
            horaInicio: '18:00',
            estado: {
              in: ['PENDIENTE_PAGO', 'PENDIENTE_VALIDACION', 'CONFIRMADA'],
            },
          },
        }),
      ).toBe(1);
    }, 30000);

    it('dos solicitudes simultáneas del mismo jugador con 1 pendiente: solo pasa una', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha();
      await insertarReserva(
        jugador.id,
        canchaId,
        MANANA,
        '18:00',
        'PENDIENTE_PAGO',
      );

      const respuestas = await Promise.all(
        ['19:00', '20:00'].map((horaInicio) =>
          reservar(jugador.cookie, { canchaId, fecha: MANANA, horaInicio }),
        ),
      );

      expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        201, 409,
      ]);
      expect(respuestas.find((r) => r.status === 409)?.body).toMatchObject({
        message: 'Ya tienes 2 reservas pendientes de pago',
      });
      expect(
        await prisma.reserva.count({
          where: { jugadorId: jugador.id, estado: 'PENDIENTE_PAGO' },
        }),
      ).toBe(2);
    });
  });

  describe('crédito al adelanto', () => {
    let jugador: { id: number; cookie: string };
    let canchas: number[];

    const cancha = async (noche: number) => {
      const id = await crearCancha({ DIA: noche, NOCHE: noche });
      canchas.push(id);
      return id;
    };

    const credito = (saldo: number, creadoEn = AHORA) =>
      prisma.credito.create({
        data: { jugadorId: jugador.id, monto: saldo, saldo, creadoEn },
      });

    const reservarConCredito = (
      datos: { canchaId: number; fecha: string; horaInicio: string },
      usarCredito = true,
    ) =>
      request(servidor())
        .post('/api/reservas')
        .set('Cookie', jugador.cookie)
        .send({ ...datos, usarCredito });

    const pagosDe = (reservaId: number) =>
      prisma.pago.findMany({
        where: { reservaId },
        include: { creditoUsos: { orderBy: { id: 'asc' } } },
      });

    const saldoDe = async (id: number) =>
      (await prisma.credito.findUniqueOrThrow({ where: { id } })).saldo.toFixed(
        2,
      );

    beforeEach(async () => {
      jugador = await crearUsuario();
      canchas = [];
    });

    afterEach(async () => {
      const canchaId = { in: canchas };
      await prisma.creditoUso.deleteMany({
        where: { credito: { jugadorId: jugador.id } },
      });
      await prisma.pago.deleteMany({ where: { reserva: { canchaId } } });
      await prisma.reserva.deleteMany({ where: { canchaId } });
      await prisma.tarifa.deleteMany({ where: { canchaId } });
      await prisma.cancha.deleteMany({ where: { id: canchaId } });
      await prisma.credito.deleteMany({ where: { jugadorId: jugador.id } });
    });

    it('crédito 10 con adelanto 30: paga 10 y quedan 20 pendientes', async () => {
      const canchaId = await cancha(60);
      const { id: creditoId } = await credito(10);
      const res = await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      expect(creada).toMatchObject({
        estado: 'PENDIENTE_PAGO',
        venceEn: new Date(AHORA.getTime() + 15 * 60 * 1000).toISOString(),
      });

      const pagos = await pagosDe(creada.id);
      expect(pagos).toHaveLength(1);
      expect(pagos[0]).toMatchObject({
        concepto: 'ADELANTO',
        canal: 'ONLINE',
        metodo: 'CREDITO',
        estado: 'APROBADO',
        registradoPorId: jugador.id,
      });
      expect(pagos[0].monto.toFixed(2)).toBe('10.00');
      const reserva = await prisma.reserva.findUniqueOrThrow({
        where: { id: creada.id },
      });
      expect(reserva.adelantoMinimo.minus(pagos[0].monto).toFixed(2)).toBe(
        '20.00',
      );
      expect(reserva.confirmadaEn).toBeNull();
      expect(await saldoDe(creditoId)).toBe('0.00');
    });

    it('crédito 50 con adelanto 30: paga 30, confirma y quedan 20 de crédito', async () => {
      const canchaId = await cancha(60);
      const { id: creditoId } = await credito(50);
      const res = await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      expect(creada).toMatchObject({ estado: 'CONFIRMADA', venceEn: null });

      const reserva = await prisma.reserva.findUniqueOrThrow({
        where: { id: creada.id },
      });
      expect(reserva).toMatchObject({
        estado: 'CONFIRMADA',
        venceEn: null,
        confirmadaEn: AHORA,
      });
      const pagos = await pagosDe(creada.id);
      expect(pagos).toHaveLength(1);
      expect(pagos[0].monto.toFixed(2)).toBe('30.00');
      expect(pagos[0].creditoUsos).toHaveLength(1);
      expect(await saldoDe(creditoId)).toBe('20.00');
    });

    it('usa primero el crédito más antiguo y deja un uso por crédito', async () => {
      const canchaId = await cancha(24);
      const nuevo = await credito(10);
      const antiguo = await credito(5, new Date(AHORA.getTime() - 60_000));
      const res = await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      expect(creada.estado).toBe('CONFIRMADA');

      const [pago] = await pagosDe(creada.id);
      expect(pago.monto.toFixed(2)).toBe('12.00');
      expect(
        pago.creditoUsos.map((u) => [u.creditoId, u.monto.toFixed(2)]),
      ).toEqual([
        [antiguo.id, '5.00'],
        [nuevo.id, '7.00'],
      ]);
      expect(await saldoDe(antiguo.id)).toBe('0.00');
      expect(await saldoDe(nuevo.id)).toBe('3.00');
    });

    it('sin usarCredito no crea pago ni toca el crédito', async () => {
      const canchaId = await cancha(60);
      const { id: creditoId } = await credito(50);
      const res = await reservarConCredito(
        { canchaId, fecha: MANANA, horaInicio: '18:00' },
        false,
      ).expect(201);
      const creada = res.body as Creada;
      expect(creada.estado).toBe('PENDIENTE_PAGO');
      expect(await pagosDe(creada.id)).toHaveLength(0);
      expect(await saldoDe(creditoId)).toBe('50.00');
    });

    it('con usarCredito y crédito 0 no crea pago', async () => {
      const canchaId = await cancha(60);
      await credito(0);
      const res = await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const creada = res.body as Creada;
      expect(creada.estado).toBe('PENDIENTE_PAGO');
      expect(await pagosDe(creada.id)).toHaveLength(0);
    });

    it('el resumen muestra el crédito que queda después de usarlo', async () => {
      const canchaId = await cancha(60);
      await credito(50);
      const antes = await resumen(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(200);
      expect((antes.body as Resumen).creditoDisponible).toBe(50);
      await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const despues = await resumen(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '19:00',
      }).expect(200);
      expect((despues.body as Resumen).creditoDisponible).toBe(20);
    });

    it('una reserva confirmada con crédito no cuenta para el límite de pendientes', async () => {
      const canchaId = await cancha(60);
      await credito(30);
      await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      for (const horaInicio of ['19:00', '20:00']) {
        await reservarConCredito(
          { canchaId, fecha: MANANA, horaInicio },
          false,
        ).expect(201);
      }
      expect(
        await prisma.reserva.count({
          where: { jugadorId: jugador.id, estado: 'PENDIENTE_PAGO' },
        }),
      ).toBe(2);
    });

    describe('con 2 reservas pendientes', () => {
      let canchaId: number;
      const turno = (horaInicio: string) => ({
        canchaId,
        fecha: MANANA,
        horaInicio,
      });
      const pendientes = () =>
        prisma.reserva.count({
          where: { jugadorId: jugador.id, estado: 'PENDIENTE_PAGO' },
        });
      const reservasEn = (horaInicio: string) =>
        prisma.reserva.count({
          where: { canchaId, horaInicio, jugadorId: jugador.id },
        });

      beforeEach(async () => {
        canchaId = await cancha(60);
        for (const horaInicio of ['18:00', '19:00']) {
          await insertarReserva(
            jugador.id,
            canchaId,
            MANANA,
            horaInicio,
            'PENDIENTE_PAGO',
          );
        }
      });

      it('si el crédito cubre el adelanto la reserva nace confirmada', async () => {
        const { id } = await credito(30);
        const consulta = await resumen(jugador.cookie, turno('20:00')).expect(
          200,
        );
        expect(consulta.body).toMatchObject({
          adelanto: 30,
          creditoDisponible: 30,
          soloConCredito: true,
        });

        const res = await reservarConCredito(turno('20:00')).expect(201);
        expect(res.body).toMatchObject({ estado: 'CONFIRMADA', venceEn: null });
        expect(await saldoDe(id)).toBe('0.00');
        expect(await pendientes()).toBe(2);
      });

      it('si el crédito cubre una parte responde 409 y no lo usa', async () => {
        const { id } = await credito(29.99);
        const consulta = await resumen(jugador.cookie, turno('20:00')).expect(
          409,
        );
        expect(consulta.body).toMatchObject({
          message: 'Ya tienes 2 reservas pendientes de pago',
        });

        const res = await reservarConCredito(turno('20:00')).expect(409);
        expect(res.body).toMatchObject({
          statusCode: 409,
          message: 'Ya tienes 2 reservas pendientes de pago',
        });
        expect(await reservasEn('20:00')).toBe(0);
        expect(await saldoDe(id)).toBe('29.99');
      });

      it('sin usarCredito responde 409 aunque el crédito alcance', async () => {
        const { id } = await credito(30);
        const res = await reservarConCredito(turno('20:00'), false).expect(409);
        expect(res.body).toMatchObject({
          message: 'Ya tienes 2 reservas pendientes de pago',
        });
        expect(await reservasEn('20:00')).toBe(0);
        expect(await saldoDe(id)).toBe('30.00');
      });

      it('dos solicitudes simultáneas con crédito para una sola: una confirmada y otra 409', async () => {
        const { id } = await credito(30);
        const respuestas = await Promise.all(
          ['20:00', '21:00'].map((horaInicio) =>
            reservarConCredito(turno(horaInicio)),
          ),
        );

        expect(respuestas.map((r) => r.status).sort((a, b) => a - b)).toEqual([
          201, 409,
        ]);
        expect(respuestas.find((r) => r.status === 201)?.body).toMatchObject({
          estado: 'CONFIRMADA',
        });
        expect(respuestas.find((r) => r.status === 409)?.body).toMatchObject({
          message: 'Ya tienes 2 reservas pendientes de pago',
        });
        expect(await saldoDe(id)).toBe('0.00');
        expect(await pendientes()).toBe(2);
        expect(
          await prisma.reserva.count({
            where: { jugadorId: jugador.id, estado: 'CONFIRMADA' },
          }),
        ).toBe(1);
      });
    });

    it('la auditoría registra el crédito aplicado', async () => {
      const canchaId = await cancha(60);
      await credito(12.5);
      const res = await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);
      const registro = await prisma.auditoria.findFirstOrThrow({
        where: { entidad: 'RESERVA', entidadId: (res.body as Creada).id },
      });
      expect(registro.detalle).toMatchObject({
        adelantoMinimo: 30,
        creditoAplicado: 12.5,
      });
    });

    it('si el turno ya está tomado no usa el crédito', async () => {
      const canchaId = await cancha(60);
      const otro = await crearUsuario();
      await insertarReserva(
        otro.id,
        canchaId,
        MANANA,
        '18:00',
        'PENDIENTE_PAGO',
      );
      const { id: creditoId } = await credito(50);
      await reservarConCredito({
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(409);
      expect(await saldoDe(creditoId)).toBe('50.00');
      expect(
        await prisma.pago.count({ where: { reserva: { canchaId } } }),
      ).toBe(0);
    });
  });

  describe('GET /api/reservas/mias', () => {
    it('devuelve solo las del jugador, las próximas primero', async () => {
      const jugador = await crearUsuario();
      const ajeno = await crearUsuario();
      const canchaId = await crearCancha();
      const pasada = await insertarReserva(
        jugador.id,
        canchaId,
        '2030-01-10',
        '18:00',
        'FINALIZADA',
      );
      const antigua = await insertarReserva(
        jugador.id,
        canchaId,
        '2030-01-05',
        '18:00',
        'EXPIRADA',
      );
      const lejana = await insertarReserva(
        jugador.id,
        canchaId,
        '2030-01-20',
        '18:00',
        'CONFIRMADA',
      );
      await insertarReserva(
        ajeno.id,
        canchaId,
        '2030-01-16',
        '18:00',
        'CONFIRMADA',
      );
      const creada = await reservar(jugador.cookie, {
        canchaId,
        fecha: MANANA,
        horaInicio: '18:00',
      }).expect(201);

      const res = await request(servidor())
        .get('/api/reservas/mias')
        .set('Cookie', jugador.cookie)
        .expect(200);
      const mias = res.body as Array<Record<string, unknown>>;

      expect(mias.map((r) => r.id)).toEqual([
        (creada.body as Creada).id,
        lejana.id,
        pasada.id,
        antigua.id,
      ]);
      expect(mias[0]).toEqual({
        id: (creada.body as Creada).id,
        codigo: (creada.body as Creada).codigo,
        fecha: MANANA,
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        estado: 'PENDIENTE_PAGO',
        venceEn: (creada.body as Creada).venceEn,
        cancha: {
          id: canchaId,
          nombre: expect.any(String) as string,
          tamano: 'FUTBOL_5',
        },
        valorTurno: 80,
        adelantoMinimo: 40,
        adelantoPagado: 0,
        saldoPendiente: 80,
      });
    });

    it('cada reserva trae su valor, el adelanto pagado y el saldo, sin perder céntimos', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 55.05, NOCHE: 55.05 });
      const turno = (horaInicio: string) => ({
        canchaId,
        fecha: MANANA,
        horaInicio,
      });
      const pago = (
        reservaId: number,
        concepto: 'ADELANTO' | 'SALDO',
        monto: number,
        estado: 'APROBADO' | 'PENDIENTE_VALIDACION' | 'RECHAZADO',
      ) =>
        prisma.pago.create({
          data: {
            reservaId,
            concepto,
            canal: 'RECEPCION',
            metodo: 'EFECTIVO',
            monto,
            estado,
            registradoPorId: adminId,
          },
        });

      const sinPagos = (
        await reservar(jugador.cookie, turno('18:00')).expect(201)
      ).body as Creada;
      await pago(sinPagos.id, 'ADELANTO', 27.53, 'PENDIENTE_VALIDACION');
      await pago(sinPagos.id, 'ADELANTO', 27.53, 'RECHAZADO');

      await prisma.credito.create({
        data: { jugadorId: jugador.id, monto: 27.53, saldo: 27.53 },
      });
      const conCredito = (
        await request(servidor())
          .post('/api/reservas')
          .set('Cookie', jugador.cookie)
          .send({ ...turno('19:00'), usarCredito: true })
          .expect(201)
      ).body as Creada;
      expect(conCredito.estado).toBe('CONFIRMADA');

      const pagada = (
        await reservar(jugador.cookie, turno('20:00')).expect(201)
      ).body as Creada;
      await pago(pagada.id, 'ADELANTO', 27.53, 'APROBADO');
      await pago(pagada.id, 'SALDO', 27.52, 'APROBADO');

      const res = await request(servidor())
        .get('/api/reservas/mias')
        .set('Cookie', jugador.cookie)
        .expect(200);
      const montos = (res.body as Array<Record<string, unknown>>).map(
        ({
          id,
          valorTurno,
          adelantoMinimo,
          adelantoPagado,
          saldoPendiente,
        }) => ({
          id,
          valorTurno,
          adelantoMinimo,
          adelantoPagado,
          saldoPendiente,
        }),
      );
      expect(montos).toEqual([
        {
          id: sinPagos.id,
          valorTurno: 55.05,
          adelantoMinimo: 27.53,
          adelantoPagado: 0,
          saldoPendiente: 55.05,
        },
        {
          id: conCredito.id,
          valorTurno: 55.05,
          adelantoMinimo: 27.53,
          adelantoPagado: 27.53,
          saldoPendiente: 27.52,
        },
        {
          id: pagada.id,
          valorTurno: 55.05,
          adelantoMinimo: 27.53,
          adelantoPagado: 27.53,
          saldoPendiente: 0,
        },
      ]);
    });

    it('sin reservas devuelve una lista vacía y otro rol responde 403', async () => {
      const jugador = await crearUsuario();
      await request(servidor())
        .get('/api/reservas/mias')
        .set('Cookie', jugador.cookie)
        .expect(200, []);
      const admin = await crearUsuario('ADMINISTRADOR');
      await request(servidor())
        .get('/api/reservas/mias')
        .set('Cookie', admin.cookie)
        .expect(403);
    });
  });
});
