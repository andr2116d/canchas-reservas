import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type {
  HorarioDia,
  Prisma,
  Reserva,
} from '../src/generated/prisma/client';
import type {
  ConceptoPago,
  EstadoPago,
  MetodoPago,
  MotivoCancelacion,
  TipoCompensacion,
} from '../src/generated/prisma/enums';
import { ReglaCancelacionService } from '../src/modules/regla-cancelacion/regla-cancelacion.service';
import { PrismaService } from '../src/prisma/prisma.service';

const HOY = '2030-01-14';
const FECHA_TURNO = '2030-01-16';
const AHORA = new Date(`${HOY}T10:00:00-05:00`);
const MS_POR_HORA = 3_600_000;

class RelojFijo {
  instante = AHORA;
  ahora() {
    return this.instante;
  }
}

interface Regla {
  horasAnticipacion: number;
  tipoCompensacion: TipoCompensacion;
}

interface Turno {
  canchaId: number;
  fecha: string;
  horaInicio: string;
}

interface Sesion {
  id: number;
  cookie: string;
}

describe('Cálculo de la compensación contra la base (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = new RelojFijo();

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let servicio: ReglaCancelacionService;
  let admin: Sesion;
  let diasOriginales: HorarioDia[];
  let configuracionOriginal: {
    inicioNoche: string;
    tiempoLimitePagoMin: number;
  };
  let reglaOriginal: Regla | undefined;
  const usuariosCreados: number[] = [];
  const canchasCreadas: number[] = [];
  let documentos = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (
    rol: 'JUGADOR' | 'ADMINISTRADOR' = 'JUGADOR',
  ): Promise<Sesion> => {
    documentos++;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Compensacion ${documentos}`,
        tipoDocumento: 'CE',
        numeroDocumento: `C${sufijo}${documentos}`,
        correo: `compensacion.${sufijo}.${documentos}@laprevia.test`,
        telefono: '900000090',
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const crearCancha = async () => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Compensacion ${sufijo} ${canchasCreadas.length + 1}`,
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

  const nuevoCaso = async (horaInicio = '18:00') => ({
    jugador: await crearUsuario(),
    turno: { canchaId: await crearCancha(), fecha: FECHA_TURNO, horaInicio },
  });

  const reservar = async (
    jugador: Sesion,
    turno: Turno,
    usarCredito = false,
  ): Promise<Reserva> => {
    const res = await request(servidor())
      .post('/api/reservas')
      .set('Cookie', jugador.cookie)
      .send({ ...turno, usarCredito })
      .expect(201);
    return prisma.reserva.findUniqueOrThrow({
      where: { id: (res.body as { id: number }).id },
    });
  };

  const plazoDelResumen = async (jugador: Sesion, turno: Turno) => {
    const res = await request(servidor())
      .get('/api/reservas/resumen')
      .query(turno)
      .set('Cookie', jugador.cookie)
      .expect(200);
    const { regla } = res.body as { regla: Regla & { plazoLimite: string } };
    return { ...regla, plazoLimite: new Date(regla.plazoLimite) };
  };

  const pagar = (
    reserva: Reserva,
    {
      concepto = 'ADELANTO',
      monto = 40,
      estado = 'APROBADO',
      metodo = 'EFECTIVO',
    }: {
      concepto?: ConceptoPago;
      monto?: number;
      estado?: EstadoPago;
      metodo?: MetodoPago;
    } = {},
    cliente: Prisma.TransactionClient | PrismaService = prisma,
  ) =>
    cliente.pago.create({
      data: {
        reservaId: reserva.id,
        concepto,
        canal: 'RECEPCION',
        metodo,
        estado,
        monto,
        registradoPorId: reserva.jugadorId,
      },
    });

  const horasAntes = (reserva: Reserva, horas: number) =>
    new Date(reserva.inicioEn.getTime() - horas * MS_POR_HORA);

  const calcular = (
    reserva: Reserva,
    horas: number,
    motivo: MotivoCancelacion = 'CLIENTE',
  ) =>
    servicio.calcularCompensacion(reserva, horasAntes(reserva, horas), motivo);

  const leerRegla = () =>
    prisma.reglaCancelacion.findUniqueOrThrow({
      where: { id: 1 },
      select: { horasAnticipacion: true, tipoCompensacion: true },
    });

  const cambiarRegla = (regla: Regla) =>
    request(servidor())
      .put('/api/regla-cancelacion')
      .set('Cookie', admin.cookie)
      .send(regla)
      .expect(200);

  const conRegla = async (regla: Regla, prueba: () => Promise<void>) => {
    const antes = await leerRegla();
    await cambiarRegla(regla);
    try {
      await prueba();
    } finally {
      await prisma.reglaCancelacion.update({ where: { id: 1 }, data: antes });
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
    servicio = modulo.get(ReglaCancelacionService);

    diasOriginales = await prisma.horarioDia.findMany();
    configuracionOriginal = await prisma.configuracion.findUniqueOrThrow({
      where: { id: 1 },
      select: { inicioNoche: true, tiempoLimitePagoMin: true },
    });
    reglaOriginal = await leerRegla();

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
        data: configuracionOriginal,
      });
    } finally {
      try {
        if (reglaOriginal)
          await prisma.reglaCancelacion.update({
            where: { id: 1 },
            data: reglaOriginal,
          });
      } finally {
        await app.close();
      }
    }
  });

  describe('con la regla copiada en la reserva', () => {
    it('regla 24 h CREDITO y adelanto 40: 30 h antes acredita, 23 h antes retiene y 24 h exactas acredita', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);
      expect(reserva).toMatchObject({
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      });
      await pagar(reserva);

      await expect(calcular(reserva, 30)).resolves.toEqual({
        resultado: 'CREDITO',
        importe: 40,
        retenido: 0,
      });
      await expect(calcular(reserva, 23)).resolves.toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 40,
      });
      await expect(calcular(reserva, 24)).resolves.toEqual({
        resultado: 'CREDITO',
        importe: 40,
        retenido: 0,
      });
    });

    it('regla 24 h DEVOLUCION y adelanto 40: 30 h antes devuelve, 23 h antes retiene y 24 h exactas devuelve', async () => {
      const { jugador, turno } = await nuevoCaso();
      let reserva!: Reserva;
      await conRegla(
        { horasAnticipacion: 24, tipoCompensacion: 'DEVOLUCION' },
        async () => {
          reserva = await reservar(jugador, turno);
        },
      );
      expect(reserva).toMatchObject({
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'DEVOLUCION',
      });
      await pagar(reserva);

      await expect(calcular(reserva, 30)).resolves.toEqual({
        resultado: 'DEVOLUCION',
        importe: 40,
        retenido: 0,
      });
      await expect(calcular(reserva, 23)).resolves.toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 40,
      });
      await expect(calcular(reserva, 24)).resolves.toEqual({
        resultado: 'DEVOLUCION',
        importe: 40,
        retenido: 0,
      });
    });

    it('sin adelanto pagado no hay compensación ni a tiempo ni fuera de plazo', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);

      for (const horas of [30, 24, 23]) {
        await expect(calcular(reserva, horas)).resolves.toEqual({
          resultado: 'SIN_COMPENSACION',
          importe: 0,
          retenido: 0,
        });
      }
    });

    it('por incidencia 1 h antes devuelve adelanto y saldo aprobados, sin el adicional', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);
      await pagar(reserva, { concepto: 'ADELANTO', monto: 40 });
      await pagar(reserva, { concepto: 'SALDO', monto: 40 });
      await pagar(reserva, { concepto: 'ADICIONALES', monto: 15 });

      await expect(calcular(reserva, 1, 'INCIDENCIA')).resolves.toEqual({
        resultado: 'DEVOLUCION',
        importe: 80,
        retenido: 0,
      });
    });

    it('cambiar la regla por PUT después de reservar no cambia el resultado', async () => {
      const { jugador, turno } = await nuevoCaso();
      const creada = await reservar(jugador, turno);
      await pagar(creada);

      await conRegla(
        { horasAnticipacion: 6, tipoCompensacion: 'DEVOLUCION' },
        async () => {
          const reserva = await prisma.reserva.findUniqueOrThrow({
            where: { id: creada.id },
          });
          await expect(calcular(reserva, 23)).resolves.toEqual({
            resultado: 'RETENCION',
            importe: 0,
            retenido: 40,
          });
          await expect(calcular(reserva, 30)).resolves.toEqual({
            resultado: 'CREDITO',
            importe: 40,
            retenido: 0,
          });
        },
      );
    });

    it('el adelanto pagado con crédito al reservar cuenta como adelanto pagado', async () => {
      const { jugador, turno } = await nuevoCaso();
      await prisma.credito.create({
        data: { jugadorId: jugador.id, monto: 50, saldo: 50 },
      });
      const reserva = await reservar(jugador, turno, true);
      expect(reserva.estado).toBe('CONFIRMADA');
      const pagos = await prisma.pago.findMany({
        where: { reservaId: reserva.id },
      });
      expect(pagos).toHaveLength(1);
      expect(pagos[0]).toMatchObject({
        concepto: 'ADELANTO',
        metodo: 'CREDITO',
        estado: 'APROBADO',
      });

      await expect(calcular(reserva, 30)).resolves.toEqual({
        resultado: 'CREDITO',
        importe: 40,
        retenido: 0,
      });
      await expect(calcular(reserva, 23)).resolves.toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 40,
      });
    });

    it('los pagos en proceso, por validar o rechazados y los de otra reserva no cuentan', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);
      const otra = await reservar(await crearUsuario(), {
        ...turno,
        horaInicio: '19:00',
      });
      await pagar(reserva, { concepto: 'ADELANTO', estado: 'EN_PROCESO' });
      for (const estado of ['PENDIENTE_VALIDACION', 'RECHAZADO'] as const) {
        await pagar(reserva, { concepto: 'ADELANTO', estado });
        await pagar(reserva, { concepto: 'SALDO', estado });
      }
      await pagar(otra, { concepto: 'ADELANTO' });
      await pagar(otra, { concepto: 'SALDO' });

      for (const motivo of ['CLIENTE', 'INCIDENCIA'] as const) {
        await expect(calcular(reserva, 30, motivo)).resolves.toEqual({
          resultado: 'SIN_COMPENSACION',
          importe: 0,
          retenido: 0,
        });
      }

      await pagar(reserva, { concepto: 'ADELANTO', monto: 25.5 });
      await expect(calcular(reserva, 30)).resolves.toEqual({
        resultado: 'CREDITO',
        importe: 25.5,
        retenido: 0,
      });
      await expect(calcular(reserva, 1, 'INCIDENCIA')).resolves.toEqual({
        resultado: 'DEVOLUCION',
        importe: 25.5,
        retenido: 0,
      });
    });

    it('dentro de una transacción ve con tx los pagos insertados en ella', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);
      const momento = horasAntes(reserva, 30);
      const deshacer = new Error('deshacer');

      await expect(
        prisma.$transaction(async (tx) => {
          await pagar(reserva, {}, tx);
          await expect(
            servicio.calcularCompensacion(reserva, momento, 'CLIENTE', tx),
          ).resolves.toEqual({
            resultado: 'CREDITO',
            importe: 40,
            retenido: 0,
          });
          await expect(
            servicio.calcularCompensacion(reserva, momento, 'CLIENTE'),
          ).resolves.toEqual({
            resultado: 'SIN_COMPENSACION',
            importe: 0,
            retenido: 0,
          });
          throw deshacer;
        }),
      ).rejects.toBe(deshacer);

      expect(
        await prisma.pago.count({ where: { reservaId: reserva.id } }),
      ).toBe(0);
    });

    it('no escribe cancelaciones, créditos ni devoluciones ni cambia la reserva', async () => {
      const { jugador, turno } = await nuevoCaso();
      const reserva = await reservar(jugador, turno);
      await pagar(reserva);
      const contar = async () => ({
        cancelaciones: await prisma.cancelacion.count(),
        creditos: await prisma.credito.count(),
        devoluciones: await prisma.devolucion.count(),
        pagos: await prisma.pago.count({ where: { reservaId: reserva.id } }),
      });
      const antes = await contar();

      await calcular(reserva, 30);
      await calcular(reserva, 23);
      await calcular(reserva, 1, 'INCIDENCIA');

      expect(await contar()).toEqual(antes);
      expect(
        await prisma.reserva.findUniqueOrThrow({ where: { id: reserva.id } }),
      ).toEqual(reserva);
    });
  });

  describe('plazo de punta a punta', () => {
    it('en el plazoLimite del resumen hay compensación y 1 ms después hay retención', async () => {
      const { jugador, turno } = await nuevoCaso();
      const { plazoLimite } = await plazoDelResumen(jugador, turno);
      const reserva = await reservar(jugador, turno);
      await pagar(reserva);

      expect(plazoLimite).toEqual(horasAntes(reserva, 24));
      await expect(
        servicio.calcularCompensacion(reserva, plazoLimite, 'CLIENTE'),
      ).resolves.toEqual({ resultado: 'CREDITO', importe: 40, retenido: 0 });
      await expect(
        servicio.calcularCompensacion(
          reserva,
          new Date(plazoLimite.getTime() + 1),
          'CLIENTE',
        ),
      ).resolves.toEqual({ resultado: 'RETENCION', importe: 0, retenido: 40 });
    });
  });
});
