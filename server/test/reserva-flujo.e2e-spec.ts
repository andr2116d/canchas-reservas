import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { configurarApp } from '../src/configurar-app';
import type { HorarioDia } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const MANANA = '2030-01-15';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const NO_DISPONIBLE = 'El turno ya no está disponible';
const LIMITE_PENDIENTES = 'Ya tienes 2 reservas pendientes de pago';

class RelojFijo {
  instante = AHORA;
  ahora() {
    return this.instante;
  }
}

type Rol = 'JUGADOR' | 'RECEPCIONISTA' | 'ADMINISTRADOR';
type Usuario = { id: number; cookie: string };
type Turno = { canchaId: number; fecha: string; horaInicio: string };

interface TurnoDisponibilidad {
  horaInicio: string;
  estado: string;
  seleccionable: boolean;
  valor?: number;
  adelanto?: number;
}

interface Creada {
  id: number;
  codigo: string;
  estado: string;
  venceEn: string | null;
}

interface Mia {
  id: number;
  codigo: string;
  fecha: string;
  horaInicio: string;
  estado: string;
}

interface TurnoAgenda {
  id: number;
  codigo: string;
  estado: string;
  valorTurno: number;
  adelantoPagado: number;
  saldoPendiente: number;
  cliente: { id: number };
}

describe('Flujo de reserva (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = new RelojFijo();

  let app: INestApplication;
  let prisma: PrismaService;
  let recepcion: Usuario;
  let admin: Usuario;
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
  let usuarios = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const cookieDe = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find(
      (c) => c.startsWith('sesion='),
    ) ?? '';

  const crearUsuario = async (rol: Rol = 'JUGADOR'): Promise<Usuario> => {
    usuarios++;
    const correo = `flujo.${sufijo}.${usuarios}@laprevia.test`;
    const contrasena = 'Flujo12345';
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Flujo ${usuarios}`,
        tipoDocumento: 'CE',
        numeroDocumento: `F${sufijo}${usuarios}`,
        correo,
        telefono: '900000080',
        passwordHash: await hash(contrasena, 4),
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const res = await request(servidor())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);
    return { id: usuario.id, cookie: cookieDe(res) };
  };

  const crearCancha = async () => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Flujo ${sufijo} ${canchasCreadas.length + 1}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    canchasCreadas.push(cancha.id);
    for (const [franja, valor] of [
      ['DIA', 60],
      ['NOCHE', 80],
    ] as const) {
      await prisma.tarifa.create({
        data: { canchaId: cancha.id, franja, valor, creadoPorId: admin.id },
      });
    }
    return cancha.id;
  };

  const disponibilidad = async (
    cookie: string,
    { canchaId, fecha, horaInicio }: Turno,
  ) => {
    const res = await request(servidor())
      .get('/api/disponibilidad')
      .query({ fecha, canchaId })
      .set('Cookie', cookie)
      .expect(200);
    const canchas = (
      res.body as { canchas: { id: number; turnos: TurnoDisponibilidad[] }[] }
    ).canchas;
    return canchas
      .find((c) => c.id === canchaId)
      ?.turnos.find((t) => t.horaInicio === horaInicio);
  };

  const resumen = (cookie: string, turno: Turno) =>
    request(servidor())
      .get('/api/reservas/resumen')
      .query(turno)
      .set('Cookie', cookie);

  const reservar = (cookie: string, turno: Turno, usarCredito = false) =>
    request(servidor())
      .post('/api/reservas')
      .set('Cookie', cookie)
      .send({ ...turno, usarCredito });

  const mias = async (cookie: string) => {
    const res = await request(servidor())
      .get('/api/reservas/mias')
      .set('Cookie', cookie)
      .expect(200);
    return res.body as Mia[];
  };

  const agenda = async ({ canchaId, fecha }: Turno) => {
    const res = await request(servidor())
      .get('/api/agenda')
      .query({ fecha, canchaId })
      .set('Cookie', recepcion.cookie)
      .expect(200);
    return res.body as TurnoAgenda[];
  };

  const cambiarEstado = (id: number, estado: 'EXPIRADA' | 'CANCELADA') =>
    prisma.reserva.update({ where: { id }, data: { estado } });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue(reloj)
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);

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

    admin = await crearUsuario('ADMINISTRADOR');
    recepcion = await crearUsuario('RECEPCIONISTA');
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

  it('el jugador ve el turno libre, pide el resumen, reserva y la ve en sus reservas', async () => {
    const jugador = await crearUsuario();
    const turno = {
      canchaId: await crearCancha(),
      fecha: MANANA,
      horaInicio: '18:00',
    };

    expect(await disponibilidad(jugador.cookie, turno)).toMatchObject({
      estado: 'DISPONIBLE',
      seleccionable: true,
      valor: 80,
      adelanto: 40,
    });
    const consulta = await resumen(jugador.cookie, turno).expect(200);
    expect(consulta.body).toMatchObject({
      valorTurno: 80,
      adelanto: 40,
      saldo: 40,
    });

    const res = await reservar(jugador.cookie, turno).expect(201);
    const creada = res.body as Creada;
    expect(creada.estado).toBe('PENDIENTE_PAGO');

    expect(await mias(jugador.cookie)).toEqual([
      expect.objectContaining({
        id: creada.id,
        codigo: creada.codigo,
        fecha: MANANA,
        horaInicio: '18:00',
        estado: 'PENDIENTE_PAGO',
      }),
    ]);
  });

  it('otro jugador ve el turno tomado como no seleccionable y si lo pide recibe 409', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const turno = {
      canchaId: await crearCancha(),
      fecha: MANANA,
      horaInicio: '18:00',
    };
    await reservar(a.cookie, turno).expect(201);

    const visto = await disponibilidad(b.cookie, turno);
    expect(visto).toMatchObject({ estado: 'PENDIENTE', seleccionable: false });
    expect(visto).not.toHaveProperty('valor');

    const res = await reservar(b.cookie, turno).expect(409);
    expect((res.body as { message: string }).message).toBe(NO_DISPONIBLE);
    expect(await mias(b.cookie)).toEqual([]);
  });

  it('la recepcionista ve la reserva en la agenda con su estado y saldo', async () => {
    const jugador = await crearUsuario();
    const turno = {
      canchaId: await crearCancha(),
      fecha: MANANA,
      horaInicio: '18:00',
    };
    const creada = (await reservar(jugador.cookie, turno).expect(201))
      .body as Creada;

    expect(await agenda(turno)).toEqual([
      expect.objectContaining({
        id: creada.id,
        codigo: creada.codigo,
        horaInicio: '18:00',
        estado: 'PENDIENTE_PAGO',
        valorTurno: 80,
        adelantoPagado: 0,
        saldoPendiente: 80,
        cliente: expect.objectContaining({ id: jugador.id }) as unknown,
      }),
    ]);
  });

  it('una reserva que pasa a EXPIRADA libera el turno y otro jugador lo reserva', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const turno = {
      canchaId: await crearCancha(),
      fecha: MANANA,
      horaInicio: '18:00',
    };
    const creada = (await reservar(a.cookie, turno).expect(201)).body as Creada;
    await reservar(b.cookie, turno).expect(409);

    await cambiarEstado(creada.id, 'EXPIRADA');

    expect(await disponibilidad(b.cookie, turno)).toMatchObject({
      estado: 'DISPONIBLE',
      seleccionable: true,
    });
    const nueva = (await reservar(b.cookie, turno).expect(201)).body as Creada;
    expect(nueva.estado).toBe('PENDIENTE_PAGO');
    expect((await mias(b.cookie)).map((r) => r.id)).toEqual([nueva.id]);
  });
});
