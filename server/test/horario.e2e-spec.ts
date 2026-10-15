import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { MENSAJE_CIERRE_POSTERIOR } from '../src/modules/horario/dto/dia-horario.dto';
import { MENSAJE_SIETE_DIAS } from '../src/modules/horario/dto/guardar-horario.dto';
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
  });

  beforeEach(() => definirHorario(SEMANA, '18:00'));

  afterAll(async () => {
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
});
