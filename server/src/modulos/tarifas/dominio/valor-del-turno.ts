import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { Monto } from '../../../compartido/dominio/monto.value-object';
import type { Tarifa } from './tarifa';

export type Franja = 'DIA' | 'NOCHE';

/** Parte del turno dentro de una franja, con lo que cuesta. */
export interface Tramo {
  franja: Franja;
  desde: string;
  hasta: string;
  monto: string;
}

export interface ValorDelTurno {
  total: Monto;
  tramos: Tramo[];
}

interface Parte {
  franja: Franja;
  desde: number;
  hasta: number;
  precio: Monto;
}

/** Turno del día en minutos desde la medianoche; nunca pasa de medianoche. */
export interface RangoDelTurno {
  desde: number;
  hasta: number;
}

/** Divide el turno en su parte de día y su parte de noche, sin partes vacías. */
function partesDelTurno(
  tarifa: Tarifa,
  { desde, hasta }: RangoDelTurno,
  inicioDeLaNoche: number,
): Parte[] {
  const corte = Math.min(Math.max(desde, inicioDeLaNoche), hasta);
  return [
    { franja: 'DIA' as const, desde, hasta: corte, precio: tarifa.precioDia },
    {
      franja: 'NOCHE' as const,
      desde: corte,
      hasta,
      precio: tarifa.precioNoche,
    },
  ].filter((parte) => parte.hasta > parte.desde);
}

/** Reparte el total redondeado entre las partes; la última absorbe los céntimos. */
function repartir(partes: Parte[], duracion: number): ValorDelTurno {
  const exacto = (parte: Parte) =>
    (parte.precio.centimos * (parte.hasta - parte.desde)) / duracion;
  const total = Math.round(
    partes.reduce((suma, parte) => suma + exacto(parte), 0),
  );
  let acumulado = 0;
  const tramos = partes.map((parte, indice) => {
    const centimos =
      indice === partes.length - 1
        ? total - acumulado
        : Math.round(exacto(parte));
    acumulado += centimos;
    return {
      franja: parte.franja,
      desde: HoraDelDia.desdeMinutos(parte.desde).texto,
      hasta: HoraDelDia.desdeMinutos(parte.hasta).texto,
      monto: Monto.desdeCentimos(centimos).enSoles(),
    };
  });
  return { total: Monto.desdeCentimos(total), tramos };
}

/**
 * Valor de un turno: cada parte vale la tarifa de su franja por la fracción
 * del turno completo que ocupa, así un turno corto se cobra en proporción. El
 * total se redondea a céntimos y el último tramo se ajusta para que el
 * desglose sume exactamente el total.
 */
export function calcularValorDelTurno(
  tarifa: Tarifa,
  turno: RangoDelTurno,
  inicioDeLaNoche: HoraDelDia,
): ValorDelTurno {
  const partes = partesDelTurno(tarifa, turno, inicioDeLaNoche.minutos);
  return repartir(partes, tarifa.duracion.minutos);
}
