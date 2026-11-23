import { Monto } from '../../../compartido/dominio/monto.value-object';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import type { ReglaDeCancelacion } from './regla-de-cancelacion';

export type FormaDeDevolucion = 'DINERO' | 'CREDITO';

export interface DatosDeLaCancelacion {
  anticipo: Monto;
  pagado: Monto;
  /** Desde que se confirma la cancelación hasta el inicio de la reserva. */
  minutosDeAnticipacion: number;
}

export interface Compensacion {
  desdeHoras: number;
  porcentaje: number;
  /** Cómo puede recibir el jugador lo que se le devuelve; vacío si se retiene el anticipo. */
  formas: FormaDeDevolucion[];
  devolucionDelAnticipo: string;
  retenido: string;
  /** Lo pagado por encima del anticipo: se devuelve siempre. */
  excedente: string;
  totalADevolver: string;
}

/**
 * Lo que recibe el jugador al cancelar: el porcentaje del rango se aplica al
 * anticipo (redondeado a céntimos) y lo pagado por encima del anticipo se devuelve.
 */
export function calcularCompensacion(
  regla: ReglaDeCancelacion,
  datos: DatosDeLaCancelacion,
): Compensacion {
  if (datos.minutosDeAnticipacion < 0) {
    throw new ValorInvalidoError(
      'La reserva ya empezó: ya no se puede cancelar.',
    );
  }
  const anticipo = datos.anticipo.centimos;
  if (datos.pagado.centimos < anticipo) {
    throw new ValorInvalidoError(
      'Lo pagado no puede ser menor que el anticipo.',
    );
  }
  const rango = regla.rangoPara(datos.minutosDeAnticipacion);
  const devolucion = Math.round((anticipo * rango.porcentaje) / 100);
  const excedente = datos.pagado.centimos - anticipo;
  const formas: FormaDeDevolucion[] =
    rango.porcentaje === 0
      ? []
      : rango.ofreceCredito
        ? ['DINERO', 'CREDITO']
        : ['DINERO'];
  const soles = (centimos: number) => Monto.desdeCentimos(centimos).enSoles();
  return {
    desdeHoras: rango.desdeHoras,
    porcentaje: rango.porcentaje,
    formas,
    devolucionDelAnticipo: soles(devolucion),
    retenido: soles(anticipo - devolucion),
    excedente: soles(excedente),
    totalADevolver: soles(devolucion + excedente),
  };
}
