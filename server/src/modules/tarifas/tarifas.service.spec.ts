import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  TarifasService,
} from './tarifas.service';

const CANCHA_ID = 3;

const DESDE = new Date('2026-10-01T15:00:00.000Z');
const HASTA = new Date('2026-10-10T15:00:00.000Z');

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
  const servicio = new TarifasService(
    prisma as unknown as PrismaService,
    auditoria as unknown as AuditoriaService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
    prisma.cancha.findUnique.mockResolvedValue({ id: CANCHA_ID });
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);

  describe('obtener', () => {
    it('devuelve las vigentes por franja y el historial completo', async () => {
      prisma.tarifa.findMany.mockResolvedValue([
        tarifa(5, 'NOCHE', '90.00', HASTA),
        tarifa(4, 'NOCHE', '80.00', DESDE, HASTA),
        tarifa(3, 'DIA', '55.05'),
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
          },
          {
            id: 4,
            franja: 'NOCHE',
            valor: 80,
            vigenteDesde: DESDE,
            vigenteHasta: HASTA,
          },
          {
            id: 3,
            franja: 'DIA',
            valor: 55.05,
            vigenteDesde: DESDE,
            vigenteHasta: null,
          },
        ],
      });
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
});
