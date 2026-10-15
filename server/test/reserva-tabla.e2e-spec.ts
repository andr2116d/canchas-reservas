import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { EstadoReserva } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const ACTIVOS: EstadoReserva[] = [
  'PENDIENTE_PAGO',
  'PENDIENTE_VALIDACION',
  'CONFIRMADA',
  'EN_JUEGO',
  'FINALIZADA',
];
const INACTIVOS: EstadoReserva[] = ['CANCELADA', 'EXPIRADA', 'AUSENTE'];

const violaUnico = (indice: string) => ({
  code: 'P2002',
  meta: { driverAdapterError: { cause: { constraint: { index: indice } } } },
});

const violaCheck = (restriccion: string) => ({
  meta: {
    driverAdapterError: {
      cause: { code: '23514', message: expect.stringContaining(restriccion) },
    },
  },
});

describe('Tabla reserva (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);

  let app: INestApplication;
  let prisma: PrismaService;
  let jugadorId: number;
  let canchaId: number;
  let otraCanchaId: number;
  let reservas = 0;

  const crearReserva = ({
    cancha = canchaId,
    fecha = '2026-11-20',
    hora = '18:00',
    estado,
    finEn,
    codigo,
  }: {
    cancha?: number;
    fecha?: string;
    hora?: string;
    estado?: EstadoReserva;
    finEn?: Date;
    codigo?: string;
  } = {}) => {
    reservas += 1;
    const fin = `${String(Number(hora.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    return prisma.reserva.create({
      data: {
        codigo: codigo ?? `R${sufijo}${reservas}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId: cancha,
        fecha: new Date(fecha),
        horaInicio: hora,
        horaFin: fin,
        inicioEn: new Date(`${fecha}T${hora}:00-05:00`),
        finEn: finEn ?? new Date(`${fecha}T${fin}:00-05:00`),
        franja: 'NOCHE',
        valorTurno: 80,
        adelantoMinimo: 40,
        estado,
        reglaHorasAnticipacion: 24,
        reglaTipoCompensacion: 'CREDITO',
      },
    });
  };

  const contarTurno = (cancha = canchaId) =>
    prisma.reserva.count({
      where: {
        canchaId: cancha,
        fecha: new Date('2026-11-20'),
        horaInicio: '18:00',
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

    const jugador = await prisma.usuario.create({
      data: {
        nombres: 'Jugador Tabla Reserva',
        tipoDocumento: 'CE',
        numeroDocumento: `R${sufijo}`,
        correo: `jugador.tabla.reserva.${sufijo}@laprevia.test`,
        telefono: '900000041',
        passwordHash: 'sin-uso',
      },
    });
    jugadorId = jugador.id;
    const cancha = await prisma.cancha.create({
      data: {
        nombre: `Tabla Reserva ${sufijo}`,
        tamano: 'FUTBOL_7',
        iluminacion: true,
      },
    });
    canchaId = cancha.id;
    const otraCancha = await prisma.cancha.create({
      data: {
        nombre: `Tabla Reserva Otra ${sufijo}`,
        tamano: 'FUTBOL_5',
        iluminacion: true,
      },
    });
    otraCanchaId = otraCancha.id;
  });

  afterEach(async () => {
    await prisma.reserva.deleteMany({ where: { jugadorId } });
  });

  afterAll(async () => {
    await prisma.cancha.deleteMany({
      where: { id: { in: [canchaId, otraCanchaId] } },
    });
    await prisma.usuario.deleteMany({ where: { id: jugadorId } });
    await app.close();
  });

  it.each(ACTIVOS)(
    'rechaza una segunda reserva activa en un turno %s',
    async (estado) => {
      await crearReserva({ estado });

      await expect(crearReserva()).rejects.toMatchObject({ code: 'P2002' });
      await expect(contarTurno()).resolves.toBe(1);
    },
  );

  it.each(INACTIVOS)(
    'una reserva %s no bloquea el turno y admite una activa encima',
    async (estado) => {
      await crearReserva({ estado });
      await crearReserva({ estado });

      await expect(crearReserva()).resolves.toMatchObject({
        estado: 'PENDIENTE_PAGO',
      });
      await expect(contarTurno()).resolves.toBe(3);
    },
  );

  it('una reserva que pasa a CANCELADA libera el turno', async () => {
    const reserva = await crearReserva();
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: 'CANCELADA' },
    });

    await expect(crearReserva()).resolves.toMatchObject({
      estado: 'PENDIENTE_PAGO',
    });
  });

  it('permite la misma fecha y hora en otra cancha', async () => {
    await crearReserva();

    await expect(crearReserva({ cancha: otraCanchaId })).resolves.toMatchObject(
      { canchaId: otraCanchaId },
    );
    await expect(contarTurno()).resolves.toBe(1);
    await expect(contarTurno(otraCanchaId)).resolves.toBe(1);
  });

  it('permite la misma cancha y hora en otra fecha', async () => {
    await crearReserva();

    await expect(crearReserva({ fecha: '2026-11-21' })).resolves.toMatchObject({
      fecha: new Date('2026-11-21'),
    });
    await expect(contarTurno()).resolves.toBe(1);
  });

  it('permite otra hora en la misma cancha y fecha', async () => {
    await crearReserva();

    await expect(crearReserva({ hora: '19:00' })).resolves.toMatchObject({
      horaInicio: '19:00',
    });
  });

  it.each([
    ['igual al', '2026-11-20T18:00:00-05:00'],
    ['anterior al', '2026-11-20T17:00:00-05:00'],
  ])('rechaza una reserva con fin %s inicio', async (_, fin) => {
    await expect(crearReserva({ finEn: new Date(fin) })).rejects.toMatchObject(
      violaCheck('reserva_horario_valido'),
    );
    await expect(contarTurno()).resolves.toBe(0);
  });

  it('rechaza una reserva con un codigo repetido en otro turno', async () => {
    const { codigo } = await crearReserva();

    await expect(crearReserva({ hora: '19:00', codigo })).rejects.toMatchObject(
      violaUnico('reserva_codigo_key'),
    );
    await expect(prisma.reserva.count({ where: { codigo } })).resolves.toBe(1);
  });
});
