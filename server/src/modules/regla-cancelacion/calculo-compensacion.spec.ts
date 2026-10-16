import { Prisma } from '../../generated/prisma/client';
import { instanteEnLima } from '../../common/fechas-lima';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuditoriaService } from '../auditoria/auditoria.service';
import { ReglaCancelacionService } from './regla-cancelacion.service';
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

  describe('fuera de plazo', () => {
    it('regla 24 h y 23 h antes retiene el adelanto', () => {
      expect(calcularCompensacion(datos({ momento: antes(23) }))).toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 40,
      });
    });

    it('1 ms después del límite retiene', () => {
      expect(
        calcularCompensacion(
          datos({ tipoCompensacion: 'DEVOLUCION', momento: antes(24, 1) }),
        ),
      ).toEqual({ resultado: 'RETENCION', importe: 0, retenido: 40 });
    });

    it('con regla 0 h retiene 1 ms después del inicio', () => {
      expect(
        calcularCompensacion(
          datos({ horasAnticipacion: 0, momento: antes(0, 1) }),
        ),
      ).toEqual({ resultado: 'RETENCION', importe: 0, retenido: 40 });
    });

    it('un momento posterior al inicio del turno retiene', () => {
      expect(calcularCompensacion(datos({ momento: antes(-2) }))).toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 40,
      });
    });

    it('retiene un adelanto de 27.53 completo, sin perder un céntimo', () => {
      expect(
        calcularCompensacion(
          datos({
            adelantoPagado: new Prisma.Decimal('27.53'),
            pagadoTurno: new Prisma.Decimal('27.53'),
            momento: antes(1),
          }),
        ),
      ).toEqual({ resultado: 'RETENCION', importe: 0, retenido: 27.53 });
    });
  });

  describe('coherencia con plazoLimite', () => {
    const servicio = new ReglaCancelacionService(
      null as unknown as PrismaService,
      null as unknown as AuditoriaService,
    );
    const turnos = [
      ['2026-10-18', '19:00'],
      ['2026-10-19', '00:30'],
      ['2026-12-31', '23:00'],
    ];
    const desfases = [
      -MS_POR_HORA,
      -60_000,
      -1_000,
      -1,
      0,
      1,
      1_000,
      60_000,
      MS_POR_HORA,
    ];

    it.each([0, 1, 24, 48])(
      'con regla %i h hay compensación si y solo si el momento no pasa el plazo',
      (horasAnticipacion) => {
        for (const [fecha, horaInicio] of turnos) {
          const plazo = servicio.plazoLimite(
            fecha,
            horaInicio,
            horasAnticipacion,
          );
          for (const desfase of desfases) {
            const momento = new Date(plazo.getTime() + desfase);
            const { resultado } = calcularCompensacion(
              datos({
                inicioEn: instanteEnLima(fecha, horaInicio),
                horasAnticipacion,
                momento,
              }),
            );
            expect(resultado).toBe(
              momento.getTime() <= plazo.getTime() ? 'CREDITO' : 'RETENCION',
            );
          }
        }
      },
    );
  });
});
