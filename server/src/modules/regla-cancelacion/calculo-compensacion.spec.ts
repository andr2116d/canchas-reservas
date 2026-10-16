import { Prisma } from '../../generated/prisma/client';
import { instanteEnLima } from '../../common/fechas-lima';
import {
  calcularCompensacion,
  type DatosCompensacion,
} from './calculo-compensacion';

const MS_POR_HORA = 3_600_000;
const inicioEn = instanteEnLima('2026-10-18', '19:00');

function antes(horas: number, ms = 0) {
  return new Date(inicioEn.getTime() - horas * MS_POR_HORA + ms);
}

function datos(cambios: Partial<DatosCompensacion> = {}): DatosCompensacion {
  return {
    inicioEn,
    horasAnticipacion: 24,
    tipoCompensacion: 'CREDITO',
    adelantoPagado: 40,
    pagadoTurno: 40,
    momento: antes(30),
    motivo: 'CLIENTE',
    ...cambios,
  };
}

describe('calcularCompensacion', () => {
  describe('sin adelanto pagado', () => {
    it('a tiempo no hay compensación', () => {
      expect(calcularCompensacion(datos({ adelantoPagado: 0 }))).toEqual({
        resultado: 'SIN_COMPENSACION',
        importe: 0,
        retenido: 0,
      });
    });

    it('fuera de plazo tampoco hay retención', () => {
      expect(
        calcularCompensacion(
          datos({
            adelantoPagado: new Prisma.Decimal('0.00'),
            pagadoTurno: 0,
            momento: antes(1),
          }),
        ),
      ).toEqual({ resultado: 'SIN_COMPENSACION', importe: 0, retenido: 0 });
    });
  });

  describe('con anticipación suficiente', () => {
    it.each(['DEVOLUCION', 'CREDITO'] as const)(
      'regla 24 h y 30 h antes con adelanto 40 da %s de 40',
      (tipoCompensacion) => {
        expect(
          calcularCompensacion(datos({ tipoCompensacion, momento: antes(30) })),
        ).toEqual({ resultado: tipoCompensacion, importe: 40, retenido: 0 });
      },
    );

    it('exactamente 24 h antes corresponde compensación', () => {
      expect(calcularCompensacion(datos({ momento: antes(24) }))).toEqual({
        resultado: 'CREDITO',
        importe: 40,
        retenido: 0,
      });
    });

    it('con regla 0 h compensa hasta el inicio exacto del turno', () => {
      expect(
        calcularCompensacion(
          datos({
            horasAnticipacion: 0,
            tipoCompensacion: 'DEVOLUCION',
            momento: inicioEn,
          }),
        ),
      ).toEqual({ resultado: 'DEVOLUCION', importe: 40, retenido: 0 });
    });

    it('devuelve un adelanto de 27.53 completo, sin perder un céntimo', () => {
      expect(
        calcularCompensacion(
          datos({
            adelantoPagado: new Prisma.Decimal('27.53'),
            pagadoTurno: new Prisma.Decimal('27.53'),
          }),
        ),
      ).toEqual({ resultado: 'CREDITO', importe: 27.53, retenido: 0 });
    });
  });
});
