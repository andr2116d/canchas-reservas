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
});
