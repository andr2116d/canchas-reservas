import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import type { EstadoReserva } from '../src/generated/prisma/client';
import { MENSAJE_CIERRE_POSTERIOR } from '../src/modules/horario/dto/dia-horario.dto';
import { MENSAJE_SIETE_DIAS } from '../src/modules/horario/dto/guardar-horario.dto';
import { MENSAJE_RESERVAS_FUERA_DE_HORARIO } from '../src/modules/horario/horario.service';
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

const semanaCon = (...cambios: Dia[]) =>
  SEMANA.map(
    (dia) => cambios.find((c) => c.diaSemana === dia.diaSemana) ?? dia,
  );

describe('Horario (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);
  const ADMIN = {
    correo: `admin.horario.${sufijo}@laprevia.test`,
    contrasena: 'Admin12345',
  };
  const RECEPCION = {
    correo: `recepcion.horario.${sufijo}@laprevia.test`,
    contrasena: 'Recepcion123',
  };

  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: number;
  let cookieAdmin: string;
  let cookieRecepcion: string;
  let diasOriginales: Dia[];
  let inicioNocheOriginal: string | undefined;
  let jugadorId: number;
  let canchaId: number;
  let reservas = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
  const iniciarSesion = (credenciales: {
    correo: string;
    contrasena: string;
  }) => request(servidor()).post('/api/auth/login').send(credenciales);
  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';
  const crearUsuario = async (
    credenciales: { correo: string; contrasena: string },
    rol: 'ADMINISTRADOR' | 'RECEPCIONISTA',
    documento: string,
  ) => {
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Prueba ${rol}`,
        tipoDocumento: 'CE',
        numeroDocumento: documento,
        correo: credenciales.correo,
        telefono: '900000041',
        passwordHash: await hash(credenciales.contrasena, 4),
        rol,
      },
    });
    return usuario.id;
  };
  const guardar = (cuerpo: object, cookie = cookieAdmin) =>
    request(servidor()).put('/api/horario').set('Cookie', cookie).send(cuerpo);
  const vistaPrevia = (fecha: string, cookie = cookieAdmin) =>
    request(servidor())
      .get('/api/horario/vista-previa')
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
  const auditoriasHorario = () =>
    prisma.auditoria.findMany({
      where: { entidad: 'HORARIO', usuarioId: adminId },
      orderBy: { id: 'asc' },
    });

  const crearReserva = (
    fecha: string,
    horaInicio: string,
    horaFin: string,
    estado: EstadoReserva = 'CONFIRMADA',
  ) =>
    prisma.reserva.create({
      data: {
        codigo: `E2E-H-${sufijo}-${++reservas}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        horaFin,
        inicioEn: new Date(`${fecha}T${horaInicio}:00-05:00`),
        finEn: new Date(`${fecha}T${horaFin}:00-05:00`),
        franja: 'DIA',
        valorTurno: 60,
        adelantoMinimo: 30,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });

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
      await prisma.configuracion.findUnique({
        where: { id: 1 },
      })
    )?.inicioNoche;

    adminId = await crearUsuario(ADMIN, 'ADMINISTRADOR', `H${sufijo}`);
    await crearUsuario(RECEPCION, 'RECEPCIONISTA', `HR${sufijo}`);
    cookieAdmin = cookieDe(await iniciarSesion(ADMIN).expect(200));
    cookieRecepcion = cookieDe(await iniciarSesion(RECEPCION).expect(200));

    const jugador = await prisma.usuario.create({
      data: {
        nombres: 'Lucia',
        apellidos: 'Rios Prueba',
        tipoDocumento: 'CE',
        numeroDocumento: `HJ${sufijo}`,
        correo: `jugador.horario.${sufijo}@laprevia.test`,
        telefono: '900000042',
        passwordHash: 'sin-uso',
        rol: 'JUGADOR',
      },
    });
    jugadorId = jugador.id;
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Horario ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
  });

  beforeEach(() => definirHorario(SEMANA, '18:00'));

  afterAll(async () => {
    try {
      await prisma.reserva.deleteMany({ where: { canchaId } });
      await prisma.cancha.deleteMany({ where: { id: canchaId } });
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

  describe('GET /api/horario', () => {
    it('sin sesión responde 401', async () => {
      await request(servidor()).get('/api/horario').expect(401);
    });

    it('con sesión devuelve los 7 días y el inicio de noche', async () => {
      const res = await request(servidor())
        .get('/api/horario')
        .set('Cookie', cookieRecepcion)
        .expect(200);

      expect(res.body).toEqual({ dias: SEMANA, inicioNoche: '18:00' });
    });
  });

  describe('permisos', () => {
    it('la recepción no puede guardar ni ver la vista previa', async () => {
      await guardar(
        { dias: SEMANA, inicioNoche: '18:00' },
        cookieRecepcion,
      ).expect(403);
      await vistaPrevia('2026-10-20', cookieRecepcion).expect(403);
    });
  });

  describe('PUT /api/horario', () => {
    it.each([
      ['igual a la apertura', '08:00'],
      ['anterior a la apertura', '07:00'],
    ])('con cierre %s responde 400 y no guarda', async (_caso, cierre) => {
      const res = await guardar({
        dias: semanaCon(abierto(3, '08:00', cierre)),
        inicioNoche: '18:00',
      }).expect(400);

      expect(res.body).toEqual({
        statusCode: 400,
        message: MENSAJE_CIERRE_POSTERIOR,
        errores: { 'dias.2.cierre': MENSAJE_CIERRE_POSTERIOR },
      });
      const dia = await prisma.horarioDia.findUnique({
        where: { diaSemana: 3 },
      });
      expect(dia?.cierre).toBe('23:00');
    });

    it.each([
      ['8h', 'dias.0.apertura', { dias: semanaCon(abierto(1, '8h')) }],
      [
        '25:00',
        'dias.0.cierre',
        { dias: semanaCon(abierto(1, '08:00', '25:00')) },
      ],
      ['8:00', 'dias.0.apertura', { dias: semanaCon(abierto(1, '8:00')) }],
      ['25:00', 'inicioNoche', { dias: SEMANA, inicioNoche: '25:00' }],
    ])('la hora %s responde 400 en %s', async (_hora, campo, cuerpo) => {
      const res = await guardar({ inicioNoche: '18:00', ...cuerpo }).expect(
        400,
      );

      expect(Object.keys(res.body.errores)).toEqual([campo]);
    });

    it('un día abierto sin horas responde 400', async () => {
      const res = await guardar({
        dias: semanaCon({
          diaSemana: 2,
          abierto: true,
          apertura: null,
          cierre: null,
        }),
        inicioNoche: '18:00',
      }).expect(400);

      expect(Object.keys(res.body.errores)).toEqual([
        'dias.1.apertura',
        'dias.1.cierre',
      ]);
    });

    it.each([
      ['faltan días', SEMANA.slice(0, 6)],
      ['un día se repite', [...SEMANA.slice(0, 6), abierto(1)]],
      ['sobra un día', [...SEMANA, abierto(1)]],
    ])('si %s responde 400', async (_caso, dias) => {
      const res = await guardar({ dias, inicioNoche: '18:00' }).expect(400);

      expect(res.body.errores).toEqual({ dias: MENSAJE_SIETE_DIAS });
    });

    it('acepta 08:15, la vista previa empieza a las 08:15 y audita el cambio', async () => {
      const auditoriasAntes = (await auditoriasHorario()).length;

      const res = await guardar({
        dias: semanaCon(abierto(2, '08:15', '23:15')),
        inicioNoche: '18:00',
        confirmar: true,
      }).expect(200);

      expect(res.body.dias[1]).toEqual(abierto(2, '08:15', '23:15'));
      const turnos = (await vistaPrevia('2026-10-20').expect(200)).body as {
        horaInicio: string;
        horaFin: string;
        franja: string;
      }[];
      expect(turnos[0]).toEqual({
        horaInicio: '08:15',
        horaFin: '09:15',
        franja: 'DIA',
      });
      expect(turnos.filter((t) => t.franja === 'DIA')).toHaveLength(9);
      expect(turnos.filter((t) => t.franja === 'NOCHE')).toHaveLength(5);

      const auditorias = await auditoriasHorario();
      expect(auditorias).toHaveLength(auditoriasAntes + 1);
      expect(auditorias.at(-1)).toMatchObject({
        accion: 'EDITAR',
        entidadId: null,
        detalle: {
          anterior: { dias: [abierto(2)] },
          nuevo: { dias: [abierto(2, '08:15', '23:15')] },
        },
      });
    });

    it('un día cerrado guarda sin horas y su vista previa sale vacía', async () => {
      await guardar({
        dias: semanaCon({ ...cerrado(7), apertura: '08:00', cierre: '07:00' }),
        inicioNoche: '18:00',
        confirmar: true,
      }).expect(200);

      const dia = await prisma.horarioDia.findUnique({
        where: { diaSemana: 7 },
      });
      expect(dia).toEqual(cerrado(7));
      await expect(
        vistaPrevia('2026-10-25')
          .expect(200)
          .then((r) => r.body),
      ).resolves.toEqual([]);
    });

    it('cambia el inicio de noche y la vista previa se alinea', async () => {
      await guardar({
        dias: SEMANA,
        inicioNoche: '18:40',
        confirmar: true,
      }).expect(200);

      const turnos = (await vistaPrevia('2026-10-20').expect(200)).body as {
        horaInicio: string;
        franja: string;
      }[];
      expect(turnos.filter((t) => t.franja === 'DIA').at(-1)?.horaInicio).toBe(
        '17:00',
      );
      expect(turnos.filter((t) => t.franja === 'NOCHE')[0].horaInicio).toBe(
        '18:40',
      );
    });

    it('sin cambios responde 200 y no audita', async () => {
      const auditoriasAntes = (await auditoriasHorario()).length;

      const res = await guardar({ dias: SEMANA, inicioNoche: '18:00' }).expect(
        200,
      );

      expect(res.body).toEqual({ dias: SEMANA, inicioNoche: '18:00' });
      expect(await auditoriasHorario()).toHaveLength(auditoriasAntes);
    });
  });

  describe('GET /api/horario/vista-previa', () => {
    it('genera los turnos de la tabla de ejemplos para esa fecha', async () => {
      await definirHorario(semanaCon(abierto(2, '08:30', '23:00')), '18:00');

      const turnos = (await vistaPrevia('2026-10-20').expect(200)).body as {
        horaInicio: string;
        franja: string;
      }[];

      expect(turnos.map((t) => t.horaInicio)).toEqual([
        '08:30',
        '09:30',
        '10:30',
        '11:30',
        '12:30',
        '13:30',
        '14:30',
        '15:30',
        '16:30',
        '18:00',
        '19:00',
        '20:00',
        '21:00',
        '22:00',
      ]);
    });

    it.each(['2026-02-30', '2026-13-01', '20-10-2026', ''])(
      'con la fecha "%s" responde 400',
      async (fecha) => {
        const res = await vistaPrevia(fecha).expect(400);

        expect(Object.keys(res.body.errores)).toEqual(['fecha']);
      },
    );
  });

  describe('reservas fuera del nuevo horario', () => {
    const fecha = fechaEnLima(3);
    const diaSemana = diaSemanaDe(fecha);
    const nuevoHorario = semanaCon(abierto(diaSemana, '09:30', '23:00'));
    const idsDe = (res: request.Response) =>
      (res.body.reservasFueraDeHorario as { id: number }[]).map((r) => r.id);

    it('sin confirmar responde 409 con la lista y no guarda; con confirmar guarda sin tocar las reservas', async () => {
      const fuera = await crearReserva(fecha, '08:00', '09:00');
      const pendiente = await crearReserva(
        fecha,
        '10:00',
        '11:00',
        'PENDIENTE_PAGO',
      );
      const dentro = await crearReserva(fecha, '20:00', '21:00');
      const cancelada = await crearReserva(
        fecha,
        '08:00',
        '09:00',
        'CANCELADA',
      );
      const pasada = await crearReserva(fechaEnLima(-7), '08:00', '09:00');

      const conflicto = await guardar({
        dias: nuevoHorario,
        inicioNoche: '18:00',
      }).expect(409);

      expect(conflicto.body).toMatchObject({
        statusCode: 409,
        message: MENSAJE_RESERVAS_FUERA_DE_HORARIO,
        errores: {},
      });
      expect(conflicto.body.reservasFueraDeHorario).toEqual(
        expect.arrayContaining([
          {
            id: fuera.id,
            cancha: `Horario ${sufijo}`,
            fecha,
            horaInicio: '08:00',
            jugador: 'Lucia Rios Prueba',
          },
          expect.objectContaining({ id: pendiente.id, horaInicio: '10:00' }),
        ]),
      );
      const ids = idsDe(conflicto);
      expect(ids).not.toContain(dentro.id);
      expect(ids).not.toContain(cancelada.id);
      expect(ids).not.toContain(pasada.id);
      const sinGuardar = await prisma.horarioDia.findUnique({
        where: { diaSemana },
      });
      expect(sinGuardar?.apertura).toBe('08:00');

      const antes = await prisma.reserva.findMany({
        where: { canchaId },
        orderBy: { id: 'asc' },
      });
      const auditoriasAntes = (await auditoriasHorario()).length;

      const res = await guardar({
        dias: nuevoHorario,
        inicioNoche: '18:00',
        confirmar: true,
      }).expect(200);

      expect(res.body.dias[diaSemana - 1]).toEqual(
        abierto(diaSemana, '09:30', '23:00'),
      );
      await expect(
        prisma.reserva.findMany({
          where: { canchaId },
          orderBy: { id: 'asc' },
        }),
      ).resolves.toEqual(antes);
      const auditorias = await auditoriasHorario();
      expect(auditorias).toHaveLength(auditoriasAntes + 1);
      const detalle = auditorias.at(-1)?.detalle as {
        reservasFueraDeHorario: number[];
      };
      expect(detalle.reservasFueraDeHorario).toEqual(
        expect.arrayContaining([fuera.id, pendiente.id]),
      );
      expect(detalle.reservasFueraDeHorario).not.toContain(dentro.id);
    });

    it('una reserva PENDIENTE_VALIDACION fuera del nuevo horario aparece en el 409', async () => {
      await prisma.reserva.deleteMany({ where: { canchaId } });
      const reserva = await crearReserva(
        fecha,
        '08:00',
        '09:00',
        'PENDIENTE_VALIDACION',
      );

      const res = await guardar({
        dias: nuevoHorario,
        inicioNoche: '18:00',
      }).expect(409);

      expect(res.body.reservasFueraDeHorario).toContainEqual(
        expect.objectContaining({ id: reserva.id, fecha, horaInicio: '08:00' }),
      );
    });

    it('una reserva EXPIRADA o una que ya pasó del mismo día no aparecen en el 409', async () => {
      await prisma.reserva.deleteMany({ where: { canchaId } });
      const pasadaMismoDia = fechaEnLima(-4);
      expect(diaSemanaDe(pasadaMismoDia)).toBe(diaSemana);
      const fuera = await crearReserva(fecha, '08:00', '09:00');
      const expirada = await crearReserva(fecha, '08:00', '09:00', 'EXPIRADA');
      const pasada = await crearReserva(pasadaMismoDia, '08:00', '09:00');

      const res = await guardar({
        dias: nuevoHorario,
        inicioNoche: '18:00',
      }).expect(409);

      const ids = idsDe(res);
      expect(ids).toContain(fuera.id);
      expect(ids).not.toContain(expirada.id);
      expect(ids).not.toContain(pasada.id);
    });

    it('una reserva que queda a mitad de turno al pasar la apertura de 08:00 a 08:30 está fuera de horario', async () => {
      await prisma.reserva.deleteMany({ where: { canchaId } });
      const mitad = await crearReserva(fecha, '08:00', '09:00');
      const noche = await crearReserva(fecha, '18:00', '19:00');

      const res = await guardar({
        dias: semanaCon(abierto(diaSemana, '08:30', '23:00')),
        inicioNoche: '18:00',
      }).expect(409);

      const ids = idsDe(res);
      expect(ids).toContain(mitad.id);
      expect(ids).not.toContain(noche.id);
    });

    it('una reserva cuyo turno sigue existiendo no bloquea el cambio', async () => {
      await prisma.reserva.deleteMany({ where: { canchaId } });
      const reserva = await crearReserva(fecha, '12:00', '13:00');

      const res = await guardar({
        dias: semanaCon(abierto(diaSemana, '09:00', '23:00')),
        inicioNoche: '18:00',
      });

      if (res.status === 409) {
        expect(idsDe(res)).not.toContain(reserva.id);
      } else {
        expect(res.status).toBe(200);
      }
    });
  });
});
