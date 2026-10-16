import type { Prisma } from '../../generated/prisma/client';
import {
  ResultadoCancelacion,
  type MotivoCancelacion,
  type TipoCompensacion,
} from '../../generated/prisma/enums';
import { aCentimos, aNumero, deCentimos } from '../tarifas/calculo-tarifa';

type Monto = Prisma.Decimal | number | string;

const MS_POR_HORA = 3_600_000;

export interface DatosCompensacion {
  inicioEn: Date;
  horasAnticipacion: number;
  tipoCompensacion: TipoCompensacion;
  adelantoPagado: Monto;
  pagadoTurno: Monto;
  momento: Date;
  motivo: MotivoCancelacion;
}

export interface Compensacion {
  resultado: ResultadoCancelacion;
  importe: number;
  retenido: number;
}

function compensacion(
  resultado: ResultadoCancelacion,
  importe: number,
  retenido: number,
): Compensacion {
  return {
    resultado,
    importe: aNumero(deCentimos(importe)),
    retenido: aNumero(deCentimos(retenido)),
  };
}

export function calcularCompensacion(datos: DatosCompensacion): Compensacion {
  const adelanto = aCentimos(datos.adelantoPagado);
  if (adelanto === 0) {
    return compensacion(ResultadoCancelacion.SIN_COMPENSACION, 0, 0);
  }
  const limite =
    datos.inicioEn.getTime() - datos.horasAnticipacion * MS_POR_HORA;
  if (datos.momento.getTime() <= limite) {
    return compensacion(datos.tipoCompensacion, adelanto, 0);
  }
  return compensacion(datos.tipoCompensacion, adelanto, 0);
}
