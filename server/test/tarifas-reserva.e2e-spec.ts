import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type { HorarioDia } from '../src/generated/prisma/client';
import { HorarioService } from '../src/modules/horario/horario.service';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const MANANA = '2030-01-15';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const SIN_TARIFA = 'La cancha no tiene tarifa para esa franja';

class RelojFijo {
  instante = AHORA;
  ahora() {
    return this.instante;
  }
}

type Rol = 'JUGADOR' | 'RECEPCIONISTA' | 'ADMINISTRADOR';
type Franja = 'DIA' | 'NOCHE';
type Usuario = { id: number; cookie: string };
type Turno = { canchaId: number; fecha: string; horaInicio: string };

interface TurnoDisponibilidad {
  horaInicio: string;
  franja: Franja;
  estado: string;
  seleccionable: boolean;
  motivo?: string;
  valor?: number;
  adelanto?: number;
}

interface Creada {
  id: number;
  estado: string;
}

describe('Tarifas al reservar (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = new RelojFijo();

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let horario: HorarioService;
  let admin: Usuario;
  let recepcion: Usuario;
  let diasOriginales: HorarioDia[];
  let inicioNocheOriginal: string;
  const usuariosCreados: number[] = [];
  const canchasCreadas: number[] = [];
  let usuarios = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (rol: Rol = 'JUGADOR'): Promise<Usuario> => {
    usuarios++;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Tarifa ${usuarios}`,
        tipoDocumento: 'CE',
        numeroDocumento: `T${sufijo}${usuarios}`,
        correo: `tarifas.reserva.${sufijo}.${usuarios}@laprevia.test`,
        telefono: '900000090',
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const definir = (canchaId: number, franja: Franja, valor: number) =>
    request(servidor())
      .put(`/api/canchas/${canchaId}/tarifas`)
      .set('Cookie', admin.cookie)
      .send({ franja, valor })
      .expect(200);

  const crearCancha = async (
    tarifas: Partial<Record<Franja, number>>,
    estado: 'OPERATIVA' | 'EN_MANTENIMIENTO' = 'OPERATIVA',
  ) => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Tarifas reserva ${sufijo} ${canchasCreadas.length + 1}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
        estado,
      },
    });
    canchasCreadas.push(cancha.id);
    for (const [franja, valor] of Object.entries(tarifas)) {
      await definir(cancha.id, franja as Franja, valor);
    }
    return cancha.id;
  };

  const turnosDe = async (cookie: string, canchaId: number, fecha: string) => {
    const res = await request(servidor())
      .get('/api/disponibilidad')
      .query({ fecha, canchaId })
      .set('Cookie', cookie)
      .expect(200);
    const canchas = (
      res.body as { canchas: { id: number; turnos: TurnoDisponibilidad[] }[] }
    ).canchas;
    return canchas.find((c) => c.id === canchaId)!.turnos;
  };

  const turnoDe = async (
    cookie: string,
    { canchaId, fecha, horaInicio }: Turno,
  ) =>
    (await turnosDe(cookie, canchaId, fecha)).find(
      (t) => t.horaInicio === horaInicio,
    );

  // La hora de corte sale de franjaDe y debe coincidir con la franja de la API.
  const corte = async (cookie: string, canchaId: number) => {
    const turnos = await turnosDe(cookie, canchaId, MANANA);
    const franjas: Franja[] = [];
    for (const turno of turnos) {
      franjas.push(await horario.franjaDe(turno.horaInicio));
    }
    expect(turnos.map((t) => t.franja)).toEqual(franjas);
    const ultimoDia = turnos[franjas.lastIndexOf('DIA')];
    const primeraNoche = turnos[franjas.indexOf('NOCHE')];
    expect(ultimoDia).toBeDefined();
    expect(primeraNoche).toBeDefined();
    return {
      dia: { canchaId, fecha: MANANA, horaInicio: ultimoDia.horaInicio },
      noche: { canchaId, fecha: MANANA, horaInicio: primeraNoche.horaInicio },
    };
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

  const guardada = (id: number) =>
    prisma.reserva.findUniqueOrThrow({ where: { id } });

  const rechazoSinTarifa = async (cookie: string, turno: Turno) => {
    for (const res of [
      await resumen(cookie, turno).expect(400),
      await reservar(cookie, turno).expect(400),
    ]) {
      expect(res.body).toEqual({
        statusCode: 400,
        message: SIN_TARIFA,
        errores: { canchaId: SIN_TARIFA },
      });
    }
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(Reloj)
      .useValue(reloj)
      .compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    prisma = modulo.get(PrismaService);
    jwt = modulo.get(JwtService, { strict: false });
    horario = modulo.get(HorarioService);

    diasOriginales = await prisma.horarioDia.findMany();
    inicioNocheOriginal = (
      await prisma.configuracion.findUniqueOrThrow({
        where: { id: 1 },
        select: { inicioNoche: true },
      })
    ).inicioNoche;

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
      data: { inicioNoche: '19:00' },
    });

    admin = await crearUsuario('ADMINISTRADOR');
    recepcion = await crearUsuario('RECEPCIONISTA');
  });

  beforeEach(() => {
    reloj.instante = AHORA;
  });

  afterAll(async () => {
    try {
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
    } finally {
      try {
        for (const { diaSemana, abierto, apertura, cierre } of diasOriginales) {
          await prisma.horarioDia.update({
            where: { diaSemana },
            data: { abierto, apertura, cierre },
          });
        }
        await prisma.horarioDia.deleteMany({
          where: {
            diaSemana: { notIn: diasOriginales.map((d) => d.diaSemana) },
          },
        });
        await prisma.configuracion.update({
          where: { id: 1 },
          data: { inicioNoche: inicioNocheOriginal },
        });
      } finally {
        await app.close();
      }
    }
  });

  describe('franja del turno', () => {
    it('el último turno de día cobra la tarifa de día y el primero de noche la de noche', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 60, NOCHE: 85 });
      const { dia, noche } = await corte(jugador.cookie, canchaId);

      for (const [turno, franja, valor, adelanto] of [
        [dia, 'DIA', 60, 30],
        [noche, 'NOCHE', 85, 42.5],
      ] as const) {
        expect(await turnoDe(jugador.cookie, turno)).toMatchObject({
          franja,
          seleccionable: true,
          valor,
          adelanto,
        });
        const consulta = await resumen(jugador.cookie, turno).expect(200);
        expect(consulta.body).toMatchObject({
          franja,
          valorTurno: valor,
          adelanto,
          saldo: valor - adelanto,
        });
        const creada = (await reservar(jugador.cookie, turno).expect(201))
          .body as Creada;
        const reserva = await guardada(creada.id);
        expect(reserva.franja).toBe(franja);
        expect(reserva.valorTurno.toFixed(2)).toBe(valor.toFixed(2));
        expect(reserva.adelantoMinimo.toFixed(2)).toBe(adelanto.toFixed(2));
      }
    });

    it('55.05 con adelanto 27.53 sale igual en disponibilidad, resumen, reserva, mias y agenda', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 60, NOCHE: 55.05 });
      const { noche: turno } = await corte(jugador.cookie, canchaId);
      await prisma.credito.create({
        data: { jugadorId: jugador.id, monto: 27.53, saldo: 27.53 },
      });

      expect(await turnoDe(jugador.cookie, turno)).toMatchObject({
        valor: 55.05,
        adelanto: 27.53,
      });
      const consulta = await resumen(jugador.cookie, turno).expect(200);
      expect(consulta.body).toMatchObject({
        valorTurno: 55.05,
        adelanto: 27.53,
        saldo: 27.52,
        creditoDisponible: 27.53,
      });

      const creada = (await reservar(jugador.cookie, turno, true).expect(201))
        .body as Creada;
      expect(creada.estado).toBe('CONFIRMADA');
      const reserva = await guardada(creada.id);
      expect(reserva.valorTurno.toFixed(2)).toBe('55.05');
      expect(reserva.adelantoMinimo.toFixed(2)).toBe('27.53');

      const mias = await request(servidor())
        .get('/api/reservas/mias')
        .set('Cookie', jugador.cookie)
        .expect(200);
      expect(mias.body).toEqual([
        expect.objectContaining({
          id: creada.id,
          franja: 'NOCHE',
          horaInicio: turno.horaInicio,
          estado: 'CONFIRMADA',
        }),
      ]);

      const agenda = await request(servidor())
        .get('/api/agenda')
        .query({ fecha: turno.fecha, canchaId })
        .set('Cookie', recepcion.cookie)
        .expect(200);
      expect(agenda.body).toEqual([
        expect.objectContaining({
          id: creada.id,
          franja: 'NOCHE',
          valorTurno: 55.05,
          adelantoPagado: 27.53,
          saldoPendiente: 27.52,
        }),
      ]);
    });
  });

  describe('cancha sin tarifa', () => {
    it('sin tarifa de noche el último turno de día se reserva', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 60 });
      const { dia } = await corte(jugador.cookie, canchaId);

      await resumen(jugador.cookie, dia).expect(200);
      const creada = (await reservar(jugador.cookie, dia).expect(201))
        .body as Creada;
      expect((await guardada(creada.id)).valorTurno.toFixed(2)).toBe('60.00');
    });

    it('sin tarifa de día rechaza de día y reserva de noche', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ NOCHE: 80 });
      const { dia, noche } = await corte(jugador.cookie, canchaId);

      expect(await turnoDe(jugador.cookie, dia)).toEqual({
        horaInicio: dia.horaInicio,
        horaFin: expect.any(String) as string,
        franja: 'DIA',
        estado: 'DISPONIBLE',
        seleccionable: false,
        motivo: 'SIN_TARIFA',
      });
      await rechazoSinTarifa(jugador.cookie, dia);

      expect(await turnoDe(jugador.cookie, noche)).toMatchObject({
        seleccionable: true,
        valor: 80,
        adelanto: 40,
      });
      await resumen(jugador.cookie, noche).expect(200);
      const creada = (await reservar(jugador.cookie, noche).expect(201))
        .body as Creada;
      expect((await guardada(creada.id)).valorTurno.toFixed(2)).toBe('80.00');
    });

    it('sin ninguna tarifa ningún turno se puede elegir ni reservar', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({});
      const { dia, noche } = await corte(jugador.cookie, canchaId);
      const turnos = await turnosDe(jugador.cookie, canchaId, MANANA);

      expect(turnos.length).toBeGreaterThan(0);
      for (const turno of turnos) {
        expect(turno).toMatchObject({
          estado: 'DISPONIBLE',
          seleccionable: false,
          motivo: 'SIN_TARIFA',
        });
        expect(turno).not.toHaveProperty('valor');
        expect(turno).not.toHaveProperty('adelanto');
      }
      await rechazoSinTarifa(jugador.cookie, dia);
      await rechazoSinTarifa(jugador.cookie, noche);
      expect(await prisma.reserva.count({ where: { canchaId } })).toBe(0);
    });

    it('al definir por PUT la tarifa que faltaba la franja se puede reservar con ese precio', async () => {
      const jugador = await crearUsuario();
      const canchaId = await crearCancha({ DIA: 60 });
      const { noche } = await corte(jugador.cookie, canchaId);
      expect(await turnoDe(jugador.cookie, noche)).toMatchObject({
        motivo: 'SIN_TARIFA',
      });

      await definir(canchaId, 'NOCHE', 90.15);

      expect(await turnoDe(jugador.cookie, noche)).toEqual({
        horaInicio: noche.horaInicio,
        horaFin: expect.any(String) as string,
        franja: 'NOCHE',
        estado: 'DISPONIBLE',
        seleccionable: true,
        valor: 90.15,
        adelanto: 45.08,
      });
      const consulta = await resumen(jugador.cookie, noche).expect(200);
      expect(consulta.body).toMatchObject({
        valorTurno: 90.15,
        adelanto: 45.08,
        saldo: 45.07,
      });
      const creada = (await reservar(jugador.cookie, noche).expect(201))
        .body as Creada;
      const reserva = await guardada(creada.id);
      expect(reserva.valorTurno.toFixed(2)).toBe('90.15');
      expect(reserva.adelantoMinimo.toFixed(2)).toBe('45.08');
    });
  });
});
