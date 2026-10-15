import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reloj } from '../src/common/reloj/reloj';
import { crearPayloadSesion } from '../src/common/sesion/cookie-sesion';
import { configurarApp } from '../src/configurar-app';
import type {
  ConceptoPago,
  EstadoPago,
  EstadoReserva,
  Rol,
} from '../src/generated/prisma/client';
import { MENSAJE_ESTADO } from '../src/modules/reservas/dto/consultar-agenda.dto';
import { PrismaService } from '../src/prisma/prisma.service';

const DIA = '2031-03-10';
const DIA_SIGUIENTE = '2031-03-11';
const AHORA = new Date(`${DIA}T10:00:00-05:00`);

interface Turno {
  id: number;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  franja: string;
  cancha: { id: number; nombre: string; tamano: string };
  cliente: { id: number; nombre: string; telefono: string };
  estado: EstadoReserva;
  valorTurno: number;
  adelantoPagado: number;
  saldoPendiente: number;
  acciones: string[];
}

describe('Agenda (e2e)', () => {
  const sufijo = String(Date.now()).slice(-9);
  const reloj = { ahora: () => AHORA };

  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let recepcion: { id: number; cookie: string };
  let admin: { id: number; cookie: string };
  let jugador: { id: number; cookie: string };
  let canchaA: number;
  let canchaB: number;
  const usuariosCreados: number[] = [];
  const canchasCreadas: number[] = [];
  const reservas: Partial<Record<string, number>> = {};
  let documentos = 0;
  let codigos = 0;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  const crearUsuario = async (rol: Rol) => {
    documentos++;
    const usuario = await prisma.usuario.create({
      data: {
        nombres: `Agenda ${documentos}`,
        apellidos: 'Ramírez',
        tipoDocumento: 'CE',
        numeroDocumento: `A${sufijo}${documentos}`,
        correo: `agenda.${sufijo}.${documentos}@laprevia.test`,
        telefono: `98765432${documentos}`,
        passwordHash: 'sin-uso',
        rol,
      },
    });
    usuariosCreados.push(usuario.id);
    const token = await jwt.signAsync(crearPayloadSesion(usuario.id, rol));
    return { id: usuario.id, cookie: `sesion=${token}` };
  };

  const crearCancha = async (letra: string) => {
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Agenda ${sufijo} ${letra}`,
        tamano: 'FUTBOL_7',
        iluminacion: true,
      },
    });
    canchasCreadas.push(cancha.id);
    return cancha.id;
  };

  const insertarReserva = async (
    nombre: string,
    canchaId: number,
    horaInicio: string,
    estado: EstadoReserva,
    fecha = DIA,
  ) => {
    codigos++;
    const horaFin = `${String(Number(horaInicio.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    const reserva = await prisma.reserva.create({
      data: {
        codigo: `AG${sufijo}${codigos}`,
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
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
    reservas[nombre] = reserva.id;
    return reserva.id;
  };

  const insertarPago = (
    reservaId: number,
    concepto: ConceptoPago,
    monto: number,
    estado: EstadoPago,
  ) =>
    prisma.pago.create({
      data: {
        reservaId,
        concepto,
        canal: 'RECEPCION',
        metodo: 'EFECTIVO',
        monto,
        estado,
        registradoPorId: recepcion.id,
      },
    });

  const agenda = (query: Record<string, string | number>, cookie?: string) => {
    const peticion = request(servidor()).get('/api/agenda').query(query);
    return cookie ? peticion.set('Cookie', cookie) : peticion;
  };

  const turnosPropios = (cuerpo: Turno[]) =>
    cuerpo.filter((turno) => canchasCreadas.includes(turno.cancha.id));

  const turno = (cuerpo: Turno[], nombre: string) => {
    const encontrado = cuerpo.find((t) => t.id === reservas[nombre]);
    if (!encontrado) throw new Error(`No vino la reserva ${nombre}`);
    return encontrado;
  };

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

    recepcion = await crearUsuario('RECEPCIONISTA');
    admin = await crearUsuario('ADMINISTRADOR');
    jugador = await crearUsuario('JUGADOR');
    canchaB = await crearCancha('B');
    canchaA = await crearCancha('A');

    await insertarReserva('enJuego', canchaA, '08:00', 'EN_JUEGO');
    await insertarReserva('cancelada', canchaB, '10:00', 'CANCELADA');
    await insertarReserva(
      'validacion',
      canchaB,
      '12:00',
      'PENDIENTE_VALIDACION',
    );
    await insertarReserva('pendiente', canchaA, '18:00', 'PENDIENTE_PAGO');
    await insertarReserva('confirmada', canchaB, '18:00', 'CONFIRMADA');
    await insertarReserva('finalizada', canchaA, '20:00', 'FINALIZADA');
    await insertarReserva('expirada', canchaA, '21:00', 'EXPIRADA');
    await insertarReserva('ausente', canchaB, '21:00', 'AUSENTE');
    await insertarReserva(
      'otroDia',
      canchaA,
      '18:00',
      'CONFIRMADA',
      DIA_SIGUIENTE,
    );
  });

  afterAll(async () => {
    const canchaId = { in: canchasCreadas };
    await prisma.pago.deleteMany({ where: { reserva: { canchaId } } });
    await prisma.reserva.deleteMany({ where: { canchaId } });
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
    await app.close();
  });

  describe('consulta por fecha', () => {
    it('devuelve los turnos del día en todos los estados, por hora y cancha', async () => {
      const { body } = await agenda({ fecha: DIA }, recepcion.cookie).expect(
        200,
      );
      expect(turnosPropios(body as Turno[]).map((t) => t.id)).toEqual([
        reservas.enJuego,
        reservas.cancelada,
        reservas.validacion,
        reservas.pendiente,
        reservas.confirmada,
        reservas.finalizada,
        reservas.expirada,
        reservas.ausente,
      ]);
    });

    it('sin fecha devuelve los turnos de hoy en Lima', async () => {
      const { body } = await agenda({}, recepcion.cookie).expect(200);
      const ids = turnosPropios(body as Turno[]).map((t) => t.id);
      expect(ids).toHaveLength(8);
      expect(ids).not.toContain(reservas.otroDia);
    });

    it('cada turno trae el contrato de la agenda', async () => {
      const { body } = await agenda({ fecha: DIA }, recepcion.cookie).expect(
        200,
      );
      expect(turno(body as Turno[], 'pendiente')).toEqual({
        id: reservas.pendiente,
        codigo: expect.stringMatching(/^AG/) as unknown as string,
        horaInicio: '18:00',
        horaFin: '19:00',
        franja: 'NOCHE',
        cancha: {
          id: canchaA,
          nombre: `Agenda ${sufijo} A`,
          tamano: 'FUTBOL_7',
        },
        cliente: {
          id: jugador.id,
          nombre: 'Agenda 3 Ramírez',
          telefono: '987654323',
        },
        estado: 'PENDIENTE_PAGO',
        valorTurno: 80,
        adelantoPagado: 0,
        saldoPendiente: 80,
        acciones: ['CANCELAR', 'REUBICAR'],
      });
    });

    it('cada estado trae solo sus acciones', async () => {
      const { body } = await agenda({ fecha: DIA }, recepcion.cookie).expect(
        200,
      );
      const acciones = Object.fromEntries(
        turnosPropios(body as Turno[]).map((t) => [t.estado, t.acciones]),
      );
      expect(acciones).toEqual({
        PENDIENTE_PAGO: ['CANCELAR', 'REUBICAR'],
        PENDIENTE_VALIDACION: [],
        CONFIRMADA: ['CHECK_IN', 'MARCAR_AUSENTE', 'CANCELAR', 'REUBICAR'],
        EN_JUEGO: ['REGISTRAR_ADICIONALES', 'FINALIZAR'],
        FINALIZADA: [],
        CANCELADA: [],
        EXPIRADA: [],
        AUSENTE: [],
      });
    });

    it('un día sin reservas devuelve una lista vacía', async () => {
      const { body } = await agenda(
        { fecha: '2031-03-12', canchaId: canchaA },
        recepcion.cookie,
      ).expect(200);
      expect(body).toEqual([]);
    });

    it('el administrador también puede consultarla', async () => {
      const { body } = await agenda({ fecha: DIA }, admin.cookie).expect(200);
      expect(turnosPropios(body as Turno[])).toHaveLength(8);
    });
  });

  describe('filtros', () => {
    it('por cancha devuelve solo esa cancha', async () => {
      const { body } = await agenda(
        { fecha: DIA, canchaId: canchaB },
        recepcion.cookie,
      ).expect(200);
      const turnos = body as Turno[];
      expect(turnos.map((t) => t.id)).toEqual([
        reservas.cancelada,
        reservas.validacion,
        reservas.confirmada,
        reservas.ausente,
      ]);
      expect(turnos.every((t) => t.cancha.id === canchaB)).toBe(true);
    });

    it('por estado devuelve solo ese estado', async () => {
      const { body } = await agenda(
        { fecha: DIA, estado: 'CONFIRMADA' },
        recepcion.cookie,
      ).expect(200);
      const turnos = body as Turno[];
      expect(turnos.every((t) => t.estado === 'CONFIRMADA')).toBe(true);
      expect(turnosPropios(turnos).map((t) => t.id)).toEqual([
        reservas.confirmada,
      ]);
    });

    it('combinados devuelven la cancha y el estado pedidos', async () => {
      const conTurno = await agenda(
        { fecha: DIA, canchaId: canchaA, estado: 'FINALIZADA' },
        recepcion.cookie,
      ).expect(200);
      expect((conTurno.body as Turno[]).map((t) => t.id)).toEqual([
        reservas.finalizada,
      ]);

      const sinTurno = await agenda(
        { fecha: DIA, canchaId: canchaA, estado: 'CONFIRMADA' },
        recepcion.cookie,
      ).expect(200);
      expect(sinTurno.body).toEqual([]);
    });
  });

  describe('saldo', () => {
    beforeAll(async () => {
      await insertarPago(reservas.confirmada!, 'ADELANTO', 40, 'APROBADO');
      await insertarPago(reservas.confirmada!, 'SALDO', 20, 'RECHAZADO');
      await insertarPago(reservas.enJuego!, 'ADELANTO', 40, 'APROBADO');
      await insertarPago(reservas.enJuego!, 'SALDO', 40, 'APROBADO');
      await insertarPago(reservas.enJuego!, 'ADICIONALES', 15, 'APROBADO');
      await insertarPago(reservas.cancelada!, 'ADELANTO', 40, 'RECHAZADO');
    });

    const montos = async (nombre: string) => {
      const { body } = await agenda({ fecha: DIA }, recepcion.cookie).expect(
        200,
      );
      const { adelantoPagado, saldoPendiente } = turno(body as Turno[], nombre);
      return { adelantoPagado, saldoPendiente };
    };

    it('un adelanto aprobado de 40 sobre 80 deja 40 y el rechazado no cuenta', async () => {
      await expect(montos('confirmada')).resolves.toEqual({
        adelantoPagado: 40,
        saldoPendiente: 40,
      });
    });

    it('un adelanto rechazado no cuenta como pagado', async () => {
      await expect(montos('cancelada')).resolves.toEqual({
        adelantoPagado: 0,
        saldoPendiente: 80,
      });
    });

    it('adelanto y saldo aprobados dejan la reserva pagada sin contar adicionales', async () => {
      await expect(montos('enJuego')).resolves.toEqual({
        adelantoPagado: 40,
        saldoPendiente: 0,
      });
    });

    it('suma varios pagos aprobados y no cuenta los que están en proceso o por validar', async () => {
      const fecha = '2031-03-13';
      const id = await insertarReserva(
        'variosPagos',
        canchaA,
        '19:00',
        'CONFIRMADA',
        fecha,
      );
      await insertarPago(id, 'ADELANTO', 10, 'APROBADO');
      await insertarPago(id, 'ADELANTO', 30, 'APROBADO');
      await insertarPago(id, 'SALDO', 25, 'APROBADO');
      await insertarPago(id, 'SALDO', 15, 'EN_PROCESO');
      await insertarPago(id, 'SALDO', 15, 'PENDIENTE_VALIDACION');

      const { body } = await agenda({ fecha }, recepcion.cookie).expect(200);

      expect(turno(body as Turno[], 'variosPagos')).toMatchObject({
        valorTurno: 80,
        adelantoPagado: 40,
        saldoPendiente: 15,
      });
    });
  });

  describe('errores', () => {
    it.each([
      ['con formato incorrecto', '10-03-2031'],
      ['que no existe', '2031-02-30'],
    ])('una fecha %s responde 400', async (_caso, fecha) => {
      const { body } = await agenda({ fecha }, recepcion.cookie).expect(400);
      expect(body).toEqual({
        statusCode: 400,
        message: 'La fecha debe tener el formato YYYY-MM-DD',
        errores: { fecha: 'La fecha debe tener el formato YYYY-MM-DD' },
      });
    });

    it('un estado fuera del enum responde 400', async () => {
      const { body } = await agenda(
        { fecha: DIA, estado: 'PAGADA' },
        recepcion.cookie,
      ).expect(400);
      expect(body).toEqual({
        statusCode: 400,
        message: MENSAJE_ESTADO,
        errores: { estado: MENSAJE_ESTADO },
      });
    });

    it('un canchaId que no es número responde 400', async () => {
      const { body } = await agenda(
        { fecha: DIA, canchaId: 'abc' },
        recepcion.cookie,
      ).expect(400);
      expect(body).toMatchObject({
        statusCode: 400,
        errores: { canchaId: 'Elige una cancha válida' },
      });
    });

    it('una cancha inexistente responde 404', async () => {
      const { body } = await agenda(
        { fecha: DIA, canchaId: 2147483647 },
        recepcion.cookie,
      ).expect(404);
      expect(body).toEqual({
        statusCode: 404,
        message: 'No se encontró la cancha',
        errores: {},
      });
    });

    it('un jugador responde 403', async () => {
      await agenda({ fecha: DIA }, jugador.cookie).expect(403);
    });

    it('sin sesión responde 401', async () => {
      await agenda({ fecha: DIA }).expect(401);
    });
  });
});
