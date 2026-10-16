import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  MENSAJE_TARIFA_CONCURRENTE,
  TarifasService,
} from './tarifas.service';

const ADMIN_ID = 7;
const CANCHA_ID = 3;

const DESDE = new Date('2026-10-01T15:00:00.000Z');
const HASTA = new Date('2026-10-10T15:00:00.000Z');
const AHORA = new Date('2026-10-12T20:45:00.000Z');

const tarifa = (
  id: number,
  franja: 'DIA' | 'NOCHE',
  valor: string,
  vigenteDesde = DESDE,
  vigenteHasta: Date | null = null,
) => ({
  id,
  franja,
  valor: new Prisma.Decimal(valor),
  vigenteDesde,
  vigenteHasta,
});

const ANA = { id: ADMIN_ID, nombres: 'Ana', apellidos: 'Torres Ruiz' };
const LUIS = { id: 8, nombres: 'Luis', apellidos: null };

const fila = (
  base: ReturnType<typeof tarifa>,
  creadoPor: typeof ANA | typeof LUIS | null = ANA,
) => ({ ...base, creadoPor });

describe('TarifasService', () => {
  const prisma = {
    cancha: { findUnique: jest.fn() },
    tarifa: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const gateway = { notificar: jest.fn() };
  const reloj = { ahora: jest.fn() };
  const servicio = new TarifasService(
    prisma as unknown as PrismaService,
    auditoria as unknown as AuditoriaService,
    gateway as unknown as TurnosGateway,
    reloj as unknown as Reloj,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.cancha.findUnique.mockResolvedValue({ id: CANCHA_ID });
    reloj.ahora.mockReturnValue(AHORA);
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);

  describe('obtener', () => {
    it('devuelve las vigentes por franja y el historial completo', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(5, 'NOCHE', '90.00', HASTA)),
        fila(tarifa(4, 'NOCHE', '80.00', DESDE, HASTA)),
        fila(tarifa(3, 'DIA', '55.05')),
      ]);

      const respuesta = await servicio.obtener(CANCHA_ID);

      expect(prisma.tarifa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { canchaId: CANCHA_ID },
          orderBy: [{ vigenteDesde: 'desc' }, { id: 'desc' }],
        }),
      );
      expect(respuesta).toEqual({
        dia: { valor: 55.05, vigenteDesde: DESDE },
        noche: { valor: 90, vigenteDesde: HASTA },
        historial: [
          {
            id: 5,
            franja: 'NOCHE',
            valor: 90,
            vigenteDesde: HASTA,
            vigenteHasta: null,
            valorAnterior: 80,
            creadoPor: { id: ADMIN_ID, nombre: 'Ana Torres Ruiz' },
          },
          {
            id: 4,
            franja: 'NOCHE',
            valor: 80,
            vigenteDesde: DESDE,
            vigenteHasta: HASTA,
            valorAnterior: null,
            creadoPor: { id: ADMIN_ID, nombre: 'Ana Torres Ruiz' },
          },
          {
            id: 3,
            franja: 'DIA',
            valor: 55.05,
            vigenteDesde: DESDE,
            vigenteHasta: null,
            valorAnterior: null,
            creadoPor: { id: ADMIN_ID, nombre: 'Ana Torres Ruiz' },
          },
        ],
      });
    });

    it('trae al usuario de cada fila en la misma consulta del historial', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(6, 'DIA', '60.00', HASTA), LUIS),
        fila(tarifa(5, 'DIA', '50.00', DESDE, HASTA), ANA),
      ]);

      const { historial } = await servicio.obtener(CANCHA_ID);

      expect(prisma.tarifa.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.tarifa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            creadoPor: { select: { id: true, nombres: true, apellidos: true } },
          }) as unknown,
        }),
      );
      expect(historial.map((h) => h.creadoPor)).toEqual([
        { id: 8, nombre: 'Luis' },
        { id: ADMIN_ID, nombre: 'Ana Torres Ruiz' },
      ]);
    });

    it('creadoPor sale null si el usuario ya no existe', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(5, 'NOCHE', '90.00'), null),
      ]);

      const { historial } = await servicio.obtener(CANCHA_ID);

      expect(historial[0].creadoPor).toBeNull();
    });

    it('el valor anterior es el de la tarifa previa de la misma franja', async () => {
      const dia = (n: number) => new Date(`2026-10-0${n}T15:00:00.000Z`);
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(16, 'NOCHE', '95.00', dia(7))),
        fila(tarifa(15, 'DIA', '62.50', dia(6))),
        fila(tarifa(14, 'NOCHE', '90.00', dia(5), dia(7))),
        fila(tarifa(13, 'DIA', '55.05', dia(4), dia(6))),
        fila(tarifa(12, 'NOCHE', '80.00', dia(3), dia(5))),
        fila(tarifa(11, 'DIA', '50.00', dia(2), dia(4))),
      ]);

      const { historial } = await servicio.obtener(CANCHA_ID);

      expect(
        historial.map(({ id, franja, valorAnterior, valor }) => [
          id,
          franja,
          valorAnterior,
          valor,
        ]),
      ).toEqual([
        [16, 'NOCHE', 90, 95],
        [15, 'DIA', 55.05, 62.5],
        [14, 'NOCHE', 80, 90],
        [13, 'DIA', 50, 55.05],
        [12, 'NOCHE', null, 80],
        [11, 'DIA', null, 50],
      ]);
    });

    it('la primera de cada franja no tiene valor anterior', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(2, 'NOCHE', '80.00', HASTA)),
        fila(tarifa(1, 'DIA', '50.00', DESDE)),
      ]);

      const { historial } = await servicio.obtener(CANCHA_ID);

      expect(historial.map((h) => h.valorAnterior)).toEqual([null, null]);
    });

    it('el valor anterior sale con 2 decimales', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        fila(tarifa(2, 'DIA', '60.00', HASTA)),
        fila(tarifa(1, 'DIA', '55.10', DESDE, HASTA)),
      ]);

      const { historial } = await servicio.obtener(CANCHA_ID);

      expect(historial[0].valorAnterior).toBe(55.1);
      expect(historial[0].valorAnterior?.toFixed(2)).toBe('55.10');
    });

    it('una franja sin tarifa vigente sale como null', async () => {
      prisma.tarifa.findMany.mockResolvedValue([]);

      await expect(servicio.obtener(CANCHA_ID)).resolves.toEqual({
        dia: null,
        noche: null,
        historial: [],
      });
    });

    it('lanza 404 si la cancha no existe', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);

      const error = await errorDe(servicio.obtener(99));

      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getResponse()).toEqual({
        statusCode: 404,
        message: MENSAJE_CANCHA_NO_ENCONTRADA,
        errores: {},
      });
      expect(prisma.tarifa.findMany).not.toHaveBeenCalled();
    });

    it('lanza 404 sin consultar la base si el id está fuera de rango', async () => {
      await expect(servicio.obtener(2147483648)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.cancha.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('definir', () => {
    it('cierra la vigente, crea la nueva con la misma fecha y audita EDITAR', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(tarifa(4, 'NOCHE', '80.00'));
      prisma.tarifa.create.mockImplementation(
        ({ data }: { data: { valor: Prisma.Decimal; vigenteDesde: Date } }) =>
          Promise.resolve(
            tarifa(5, 'NOCHE', data.valor.toFixed(2), data.vigenteDesde),
          ),
      );

      const respuesta = await servicio.definir(
        CANCHA_ID,
        { franja: 'NOCHE', valor: 90.5 },
        ADMIN_ID,
      );

      const cierre = prisma.tarifa.update.mock.calls[0][0] as {
        where: { id: number };
        data: { vigenteHasta: Date };
      };
      const creacion = prisma.tarifa.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(cierre.where).toEqual({ id: 4 });
      expect(creacion.data).toEqual({
        canchaId: CANCHA_ID,
        franja: 'NOCHE',
        valor: new Prisma.Decimal('90.50'),
        vigenteDesde: cierre.data.vigenteHasta,
        creadoPorId: ADMIN_ID,
      });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: ADMIN_ID,
          accion: 'EDITAR',
          entidad: 'TARIFA',
          entidadId: 5,
          detalle: {
            canchaId: CANCHA_ID,
            franja: 'NOCHE',
            anterior: { valor: 80 },
            nuevo: { valor: 90.5 },
          },
        },
        prisma,
      );
      expect(respuesta).toEqual({
        franja: 'NOCHE',
        valor: 90.5,
        vigenteDesde: cierre.data.vigenteHasta,
      });
    });

    it('con el reloj fijo la nueva empieza y la anterior termina a la hora del reloj', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(tarifa(4, 'DIA', '60.00'));
      prisma.tarifa.create.mockResolvedValue(tarifa(5, 'DIA', '65.00', AHORA));

      await servicio.definir(CANCHA_ID, { franja: 'DIA', valor: 65 }, ADMIN_ID);

      expect(prisma.tarifa.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { vigenteHasta: AHORA },
      });
      expect(prisma.tarifa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ vigenteDesde: AHORA }) as unknown,
        }),
      );
    });

    it('la primera tarifa de la franja no cierra nada y audita CREAR', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(null);
      prisma.tarifa.create.mockResolvedValue(tarifa(6, 'DIA', '60.00'));

      await servicio.definir(CANCHA_ID, { franja: 'DIA', valor: 60 }, ADMIN_ID);

      expect(prisma.tarifa.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CREAR',
          entidadId: 6,
          detalle: {
            canchaId: CANCHA_ID,
            franja: 'DIA',
            anterior: { valor: null },
            nuevo: { valor: 60 },
          },
        }),
        prisma,
      );
    });

    it('con el mismo valor no crea registro ni auditoría', async () => {
      const vigente = tarifa(4, 'NOCHE', '80.00');
      prisma.tarifa.findFirst.mockResolvedValue(vigente);

      const respuesta = await servicio.definir(
        CANCHA_ID,
        { franja: 'NOCHE', valor: 80 },
        ADMIN_ID,
      );

      expect(respuesta).toEqual({
        franja: 'NOCHE',
        valor: 80,
        vigenteDesde: DESDE,
      });
      expect(prisma.tarifa.update).not.toHaveBeenCalled();
      expect(prisma.tarifa.create).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('lanza 404 si la cancha no existe', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);

      await expect(
        servicio.definir(99, { franja: 'DIA', valor: 50 }, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('si otra vigente se creó al mismo tiempo responde 409', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(null);
      prisma.tarifa.create.mockRejectedValue({ code: 'P2002' });

      const error = await errorDe(
        servicio.definir(CANCHA_ID, { franja: 'DIA', valor: 50 }, ADMIN_ID),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_TARIFA_CONCURRENTE,
        errores: {},
      });
    });

    it('propaga los demás errores', async () => {
      const falla = new Error('sin conexión');
      prisma.tarifa.findFirst.mockRejectedValue(falla);

      await expect(
        servicio.definir(CANCHA_ID, { franja: 'DIA', valor: 50 }, ADMIN_ID),
      ).rejects.toBe(falla);
    });
  });

  describe('notificación de turnos', () => {
    const DIA_50 = { franja: 'DIA' as const, valor: 50 };

    it('al crear la primera tarifa notifica la cancha para todas las fechas', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(null);
      prisma.tarifa.create.mockResolvedValue(tarifa(6, 'DIA', '50.00'));
      await servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, CANCHA_ID);
    });

    it('al reemplazar la vigente notifica la cancha', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(tarifa(4, 'DIA', '40.00'));
      prisma.tarifa.create.mockResolvedValue(tarifa(6, 'DIA', '50.00'));
      await servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID);
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
      expect(gateway.notificar).toHaveBeenCalledWith(null, CANCHA_ID);
    });

    it('notifica recién cuando la transacción confirma', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(null);
      prisma.tarifa.create.mockResolvedValue(tarifa(6, 'DIA', '50.00'));
      let confirmar: () => void = () => undefined;
      prisma.$transaction.mockImplementation(
        (fn: (tx: unknown) => Promise<unknown>) =>
          fn(prisma).then(
            (resultado) =>
              new Promise((resolve) => {
                confirmar = () => resolve(resultado);
              }),
          ),
      );
      const definiendo = servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID);
      await new Promise((resolve) => setImmediate(resolve));
      expect(auditoria.registrar).toHaveBeenCalled();
      expect(gateway.notificar).not.toHaveBeenCalled();
      confirmar();
      await definiendo;
      expect(gateway.notificar).toHaveBeenCalledTimes(1);
    });

    describe('no notifica', () => {
      afterEach(() => {
        expect(gateway.notificar).not.toHaveBeenCalled();
      });

      it('con el mismo valor que la vigente', async () => {
        prisma.tarifa.findFirst.mockResolvedValue(tarifa(4, 'DIA', '50.00'));
        await expect(
          servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID),
        ).resolves.toEqual({ franja: 'DIA', valor: 50, vigenteDesde: DESDE });
      });

      it('si la cancha no existe', async () => {
        prisma.cancha.findUnique.mockResolvedValue(null);
        await expect(
          servicio.definir(99, DIA_50, ADMIN_ID),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('si otra vigente se creó al mismo tiempo', async () => {
        prisma.tarifa.findFirst.mockResolvedValue(null);
        prisma.tarifa.create.mockRejectedValue({ code: 'P2002' });
        await expect(
          servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID),
        ).rejects.toBeInstanceOf(ConflictException);
      });

      it('si la transacción falla', async () => {
        prisma.$transaction.mockRejectedValue(new Error('conexión perdida'));
        await expect(
          servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID),
        ).rejects.toThrow('conexión perdida');
      });

      it('si falla la auditoría dentro de la transacción', async () => {
        prisma.tarifa.findFirst.mockResolvedValue(null);
        prisma.tarifa.create.mockResolvedValue(tarifa(6, 'DIA', '50.00'));
        auditoria.registrar.mockRejectedValue(new Error('fallo al auditar'));
        await expect(
          servicio.definir(CANCHA_ID, DIA_50, ADMIN_ID),
        ).rejects.toThrow('fallo al auditar');
      });
    });
  });

  describe('calcularTurno', () => {
    it.each([
      ['80.00', '80.00', '40.00'],
      ['55.05', '55.05', '27.53'],
    ])(
      'con valor %s devuelve valor %s y adelanto %s',
      async (valor, esperado, adelanto) => {
        prisma.tarifa.findFirst.mockResolvedValue({
          valor: new Prisma.Decimal(valor),
        });

        const turno = await servicio.calcularTurno(CANCHA_ID, 'NOCHE');

        expect(prisma.tarifa.findFirst).toHaveBeenCalledWith({
          where: { canchaId: CANCHA_ID, franja: 'NOCHE', vigenteHasta: null },
          select: { valor: true },
        });
        expect(turno?.valor).toBeInstanceOf(Prisma.Decimal);
        expect(turno?.valor.toFixed(2)).toBe(esperado);
        expect(turno?.adelanto).toBeInstanceOf(Prisma.Decimal);
        expect(turno?.adelanto.toFixed(2)).toBe(adelanto);
      },
    );

    it('devuelve null si la cancha no tiene tarifa vigente en la franja', async () => {
      prisma.tarifa.findFirst.mockResolvedValue(null);

      await expect(
        servicio.calcularTurno(CANCHA_ID, 'DIA'),
      ).resolves.toBeNull();
    });

    it('usa el cliente de transacción que recibe', async () => {
      const tx = { tarifa: { findFirst: jest.fn().mockResolvedValue(null) } };

      await servicio.calcularTurno(
        CANCHA_ID,
        'DIA',
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.tarifa.findFirst).toHaveBeenCalled();
      expect(prisma.tarifa.findFirst).not.toHaveBeenCalled();
    });
  });
});
