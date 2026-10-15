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

describe('Tabla reserva (e2e)', () => {
  const sufijo = String(Date.now()).slice(-11);

  let app: INestApplication;
  let prisma: PrismaService;
  let jugadorId: number;
  let canchaId: number;
  let reservas = 0;

  const crearReserva = ({
    cancha = canchaId,
    fecha = '2026-11-20',
    hora = '18:00',
    estado,
  }: {
    cancha?: number;
    fecha?: string;
    hora?: string;
    estado?: EstadoReserva;
  } = {}) => {
    reservas += 1;
    const fin = `${String(Number(hora.slice(0, 2)) + 1).padStart(2, '0')}:00`;
    return prisma.reserva.create({
      data: {
        codigo: `R${sufijo}${reservas}`,
        jugadorId,
        creadoPorId: jugadorId,
        canchaId: cancha,
        fecha: new Date(fecha),
        horaInicio: hora,
        horaFin: fin,
        inicioEn: new Date(`${fecha}T${hora}:00-05:00`),
        finEn: new Date(`${fecha}T${fin}:00-05:00`),
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
  });

  afterEach(async () => {
    await prisma.reserva.deleteMany({ where: { jugadorId } });
  });

  afterAll(async () => {
    await prisma.cancha.deleteMany({ where: { id: canchaId } });
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
});
