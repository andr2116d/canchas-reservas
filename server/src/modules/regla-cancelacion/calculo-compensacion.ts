import type { Prisma } from '../../generated/prisma/client';
import {
  MotivoCancelacion,
  ResultadoCancelacion,
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
  // Incidencia del complejo: se devuelve lo pagado del turno (adelanto y saldo,
  // sin adicionales) sin mirar el plazo y nada queda retenido. Sin nada pagado
  // no hay compensacion.
  if (datos.motivo === MotivoCancelacion.INCIDENCIA) {
    const pagado = aCentimos(datos.pagadoTurno);
    return pagado === 0
      ? compensacion(ResultadoCancelacion.SIN_COMPENSACION, 0, 0)
      : compensacion(ResultadoCancelacion.DEVOLUCION, pagado, 0);
  }
  const adelanto = aCentimos(datos.adelantoPagado);
  if (adelanto === 0) {
    return compensacion(ResultadoCancelacion.SIN_COMPENSACION, 0, 0);
  }
  // Un momento posterior al inicio del turno queda fuera de plazo y retiene;
  // si se puede cancelar a esa hora lo decide el flujo de cancelar.
  const limite =
    datos.inicioEn.getTime() - datos.horasAnticipacion * MS_POR_HORA;
  if (datos.momento.getTime() <= limite) {
    return compensacion(datos.tipoCompensacion, adelanto, 0);
  }
  return compensacion(ResultadoCancelacion.RETENCION, 0, adelanto);
}
