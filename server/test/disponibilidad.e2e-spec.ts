import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { instanteEnLima } from '../src/common/fechas-lima';
import { MENSAJE_FECHA } from '../src/modules/horario/dto/vista-previa.dto';
import {
  MENSAJE_FUERA_DE_RANGO,
  type TurnoDisponibilidad,
} from '../src/modules/turnos/disponibilidad.service';
import { diaSemanaDe } from '../src/modules/turnos/generar-turnos';
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
const cerrado = (diaSemana: number) => ({
  diaSemana,
  abierto: false,
  apertura: null,
  cierre: null,
});
const SEMANA: Dia[] = [1, 2, 3, 4, 5, 6, 7].map((dia) => abierto(dia));

function fechaEnLima(diasDesdeHoy: number) {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
  }).format(new Date());
  const fecha = new Date(`${hoy}T00:00:00.000Z`);
  fecha.setUTCDate(fecha.getUTCDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}

function horaEnLima() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

describe('Disponibilidad (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const CREDENCIALES = {
    jugador: {
      correo: `jugador.disponibilidad.${sufijo}@laprevia.test`,
      contrasena: 'Jugador123',
    },
    recepcion: {
      correo: `recepcion.disponibilidad.${sufijo}@laprevia.test`,
      contrasena: 'Recepcion123',
    },
    admin: {
      correo: `admin.disponibilidad.${sufijo}@laprevia.test`,
      contrasena: 'Admin12345',
    },
  };

  let app: INestApplication;
  let prisma: PrismaService;
  let cookieJugador: string;
  let cookieRecepcion: string;
  let cookieAdmin: string;
  let jugadorId: number;
  let adminId: number;
  let diasOriginales: Dia[];
  let inicioNocheOriginal: string | undefined;

  const server = () => app.getHttpServer() as Parameters<typeof request>[0];
  const iniciarSesion = (credenciales: {
    correo: string;
    contrasena: string;
  }) => request(server()).post('/api/auth/login').send(credenciales);
  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';

  const consultar = (query: object, cookie = cookieJugador) =>
    request(server())
      .get('/api/disponibilidad')
      .query(query)
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

  const crearUsuario = async (
    credenciales: { correo: string; contrasena: string },
    rol: 'JUGADOR' | 'RECEPCIONISTA' | 'ADMINISTRADOR',
    documento: string,
    telefono: string,
  ) =>
    prisma.usuario.create({
      data: {
        nombres: 'Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: documento,
        correo: credenciales.correo,
        telefono,
        passwordHash: await hash(credenciales.contrasena, 4),
        rol,
      },
      select: { id: true },
    });

  const crearCancha = (nombre: string, extra: object = {}) =>
    prisma.cancha.create({
      data: {
        nombre: `Disp ${nombre} ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
        ...extra,
      },
      select: { id: true, nombre: true },
    });

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
        creadoPorId: adminId,
      },
    });

  let principal: { id: number; nombre: string };
  let sinNoche: { id: number; nombre: string };
  let extra: { id: number; nombre: string };
  let reservas = 0;

  const crearReserva = (
    canchaId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    franja: 'DIA' | 'NOCHE',
    estado:
      | 'PENDIENTE_PAGO'
      | 'PENDIENTE_VALIDACION'
      | 'CONFIRMADA'
      | 'EN_JUEGO'
      | 'FINALIZADA'
      | 'CANCELADA',
  ) =>
    prisma.reserva.create({
      data: {
        codigo: `E2E-D-${sufijo}-${++reservas}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        horaFin,
        inicioEn: instanteEnLima(fecha, horaInicio),
        finEn: instanteEnLima(fecha, horaFin),
        franja,
        valorTurno: 60,
        adelantoMinimo: 30,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
      select: { id: true },
    });

  type Respuesta = {
    body: { canchas: { id: number; turnos: TurnoDisponibilidad[] }[] };
  };
  const turnosDe = (id: number, res: Respuesta) =>
    res.body.canchas.find((c) => c.id === id)?.turnos ?? [];

  const turno = (lista: TurnoDisponibilidad[], hora: string) =>
    lista.find((t) => t.horaInicio === hora);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

    diasOriginales = await prisma.horarioDia.findMany();
    inicioNocheOriginal = (
      await prisma.configuracion.findUnique({ where: { id: 1 } })
    )?.inicioNoche;

    adminId = (
      await crearUsuario(
        CREDENCIALES.admin,
        'ADMINISTRADOR',
        `DA${sufijo}`,
        `9001${sufijo.slice(-7)}`,
      )
    ).id;
    const jugador = await crearUsuario(
      CREDENCIALES.jugador,
      'JUGADOR',
      `DJ${sufijo}`,
      `9002${sufijo.slice(-7)}`,
    );
    jugadorId = jugador.id;
    await crearUsuario(
      CREDENCIALES.recepcion,
      'RECEPCIONISTA',
      `DR${sufijo}`,
      `9003${sufijo.slice(-7)}`,
    );

    cookieJugador = cookieDe(
      await iniciarSesion(CREDENCIALES.jugador).expect(200),
    );
    cookieRecepcion = cookieDe(
      await iniciarSesion(CREDENCIALES.recepcion).expect(200),
    );
    cookieAdmin = cookieDe(await iniciarSesion(CREDENCIALES.admin).expect(200));

    principal = await crearCancha('Principal');
    sinNoche = await crearCancha('SinNoche');
    extra = await crearCancha('Extra');
    await ponerTarifa(principal.id, 'DIA', 60);
    await ponerTarifa(principal.id, 'NOCHE', 80);
    await ponerTarifa(sinNoche.id, 'DIA', 50);
    await ponerTarifa(extra.id, 'DIA', 90);
    await ponerTarifa(extra.id, 'NOCHE', 120);
  });

  const canchasDePrueba = () => [principal.id, sinNoche.id, extra.id];

  /** Cada test arranca igual: sin reservas y con las canchas como estaban. */
  beforeEach(async () => {
    await prisma.reserva.deleteMany({
      where: { canchaId: { in: canchasDePrueba() } },
    });
    await prisma.cancha.updateMany({
      where: { id: { in: canchasDePrueba() } },
      data: { activa: true, estado: 'OPERATIVA' },
    });
    await definirHorario(SEMANA, '18:00');
  });

  afterAll(async () => {
    await prisma.reserva.deleteMany({
      where: { canchaId: { in: canchasDePrueba() } },
    });
    await prisma.tarifa.deleteMany({
      where: { canchaId: { in: canchasDePrueba() } },
    });
    await prisma.cancha.deleteMany({
      where: { id: { in: canchasDePrueba() } },
    });
    await prisma.registroAcceso.deleteMany({
      where: { correo: { contains: `.disponibilidad.${sufijo}@` } },
    });
    await prisma.usuario.deleteMany({
      where: {
        numeroDocumento: { in: [`DA${sufijo}`, `DJ${sufijo}`, `DR${sufijo}`] },
      },
    });
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

  describe('sesión y validación de la query', () => {
    it('sin sesión responde 401', async () => {
      await request(server())
        .get('/api/disponibilidad')
        .query({ fecha: fechaEnLima(3) })
        .expect(401);
    });

    it.each([
      ['recepcionista', () => cookieRecepcion],
      ['administrador', () => cookieAdmin],
    ])('el %s también puede consultar', async (_rol, cookie) => {
      await consultar({ fecha: fechaEnLima(3) }, cookie()).expect(200);
    });

    it.each([
      ['la fecha de ayer', -1],
      ['la fecha de hoy más 31 días', 31],
    ])('%s devuelve 400 con el mensaje de la spec', async (_caso, dias) => {
      const res = await consultar({ fecha: fechaEnLima(dias) }).expect(400);

      expect(res.body.message).toBe(MENSAJE_FUERA_DE_RANGO);
    });

    it('una fecha con formato inválido devuelve 400', async () => {
      const res = await consultar({ fecha: '2026-13-45' }).expect(400);

      expect(res.body.message).toBe(MENSAJE_FECHA);
    });

    it('acepta el límite exacto de 30 días', async () => {
      await consultar({ fecha: fechaEnLima(30) }).expect(200);
    });
  });

  describe('precio y adelanto', () => {
    it('un turno disponible trae el precio y el adelanto de la tarifa vigente', async () => {
      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);

      expect(turno(turnosDe(principal.id, res), '08:00')).toEqual({
        horaInicio: '08:00',
        horaFin: '09:00',
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 60,
        adelanto: 30,
      });
    });

    it('el precio de noche sale de la tarifa de noche', async () => {
      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);

      expect(turno(turnosDe(principal.id, res), '18:00')).toEqual({
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 80,
        adelanto: 40,
      });
    });

    it('una cancha sin tarifa de noche marca los turnos de noche con SIN_TARIFA', async () => {
      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);
      const turnos = turnosDe(sinNoche.id, res);

      expect(turno(turnos, '08:00')).toMatchObject({
        seleccionable: true,
        valor: 50,
        adelanto: 25,
      });
      expect(turno(turnos, '18:00')).toEqual({
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'SIN_TARIFA',
      });
    });

    it('un turno no seleccionable no trae valor ni adelanto', async () => {
      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);
      const sinTarifa = turno(turnosDe(sinNoche.id, res), '18:00')!;

      expect(sinTarifa).not.toHaveProperty('valor');
      expect(sinTarifa).not.toHaveProperty('adelanto');
    });
  });

  describe('reservas que ocupan el turno', () => {
    const fecha = () => fechaEnLima(3);

    it.each([
      ['PENDIENTE_PAGO', 'PENDIENTE'],
      ['PENDIENTE_VALIDACION', 'PENDIENTE'],
      ['CONFIRMADA', 'OCUPADO'],
      ['EN_JUEGO', 'OCUPADO'],
      ['FINALIZADA', 'OCUPADO'],
    ] as const)('una reserva %s deja el turno %s', async (estado, esperado) => {
      await crearReserva(
        principal.id,
        fecha(),
        '10:00',
        '11:00',
        'DIA',
        estado,
      );

      const res = await consultar({ fecha: fecha() }).expect(200);

      expect(turno(turnosDe(principal.id, res), '10:00')).toEqual({
        horaInicio: '10:00',
        horaFin: '11:00',
        franja: 'DIA',
        estado: esperado,
        seleccionable: false,
      });
    });

    it('una reserva CANCELADA deja el turno disponible', async () => {
      await crearReserva(
        principal.id,
        fecha(),
        '11:00',
        '12:00',
        'DIA',
        'CANCELADA',
      );

      const res = await consultar({ fecha: fecha() }).expect(200);

      expect(turno(turnosDe(principal.id, res), '11:00')).toMatchObject({
        estado: 'DISPONIBLE',
        seleccionable: true,
      });
    });

    it('no afecta a los turnos vecinos', async () => {
      await crearReserva(
        principal.id,
        fecha(),
        '10:00',
        '11:00',
        'DIA',
        'CONFIRMADA',
      );

      const res = await consultar({ fecha: fecha() }).expect(200);
      const turnos = turnosDe(principal.id, res);

      expect(turno(turnos, '09:00')).toMatchObject({ estado: 'DISPONIBLE' });
      expect(turno(turnos, '11:00')).toMatchObject({ estado: 'DISPONIBLE' });
    });

    it('no afecta a las otras canchas', async () => {
      await crearReserva(
        principal.id,
        fecha(),
        '10:00',
        '11:00',
        'DIA',
        'CONFIRMADA',
      );

      const res = await consultar({ fecha: fecha() }).expect(200);

      expect(turno(turnosDe(sinNoche.id, res), '10:00')).toMatchObject({
        estado: 'DISPONIBLE',
        seleccionable: true,
      });
    });
  });

  describe('estado de la cancha', () => {
    it('una cancha en mantenimiento muestra todos sus turnos en mantenimiento', async () => {
      await prisma.cancha.update({
        where: { id: extra.id },
        data: { estado: 'EN_MANTENIMIENTO' },
      });

      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);
      const turnos = turnosDe(extra.id, res);

      expect(turnos).toHaveLength(15);
      for (const t of turnos) {
        expect(t).toMatchObject({
          estado: 'EN_MANTENIMIENTO',
          seleccionable: false,
        });
        expect(t).not.toHaveProperty('valor');
      }
    });

    it('una cancha desactivada no aparece', async () => {
      await prisma.cancha.update({
        where: { id: extra.id },
        data: { activa: false },
      });

      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);

      expect(res.body.canchas.map((c: { id: number }) => c.id)).not.toContain(
        extra.id,
      );
    });

    it('la respuesta no expone el estado interno de la cancha', async () => {
      const res = await consultar({ fecha: fechaEnLima(3) }).expect(200);

      expect(res.body.canchas[0]).not.toHaveProperty('estado');
    });
  });

  describe('horario', () => {
    it('un día cerrado devuelve abierto en false y las canchas sin turnos', async () => {
      const fecha = fechaEnLima(3);
      await definirHorario(
        SEMANA.map((dia) =>
          dia.diaSemana === diaSemanaDe(fecha) ? cerrado(dia.diaSemana) : dia,
        ),
        '18:00',
      );

      const res = await consultar({ fecha }).expect(200);

      expect(res.body.abierto).toBe(false);
      expect(res.body.canchas.length).toBeGreaterThan(0);
      for (const c of res.body.canchas) expect(c.turnos).toEqual([]);
    });

    it('el filtro por cancha devuelve solo esa cancha', async () => {
      const res = await consultar({
        fecha: fechaEnLima(3),
        canchaId: principal.id,
      }).expect(200);

      expect(res.body.canchas).toHaveLength(1);
      expect(res.body.canchas[0].id).toBe(principal.id);
    });

    it('hoy los turnos que ya pasaron salen con PASADO y los de ahora no', async () => {
      const hoy = fechaEnLima(0);
      await definirHorario(
        SEMANA.map((dia) =>
          dia.diaSemana === diaSemanaDe(hoy)
            ? abierto(dia.diaSemana, '00:00', '23:00')
            : dia,
        ),
        '18:00',
      );

      const res = await consultar({ fecha: hoy }).expect(200);
      const ahora = horaEnLima();
      const turnos = turnosDe(principal.id, res);

      expect(turnos).toHaveLength(23);
      for (const t of turnos) {
        const paso = t.horaInicio <= ahora;
        expect(t.motivo).toBe(paso ? 'PASADO' : undefined);
        expect(t.estado).toBe('DISPONIBLE');
        expect(t.seleccionable).toBe(!paso);
      }
    });
  });
});
