import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { Monto } from './monto.value-object';
import type { Tarifa } from './tarifa';

const MEDIANOCHE = 24 * 60;

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

/** Divide el turno en su parte de día y su parte de noche, sin partes vacías. */
function partesDelTurno(
  tarifa: Tarifa,
  inicio: number,
  inicioDeLaNoche: number,
): Parte[] {
  const fin = inicio + tarifa.duracion.minutos;
  if (fin > MEDIANOCHE) {
    throw new ValorInvalidoError(
      'El turno debe terminar antes de la medianoche.',
    );
  }
  const corte = Math.min(Math.max(inicio, inicioDeLaNoche), fin);
  return [
    {
      franja: 'DIA' as const,
      desde: inicio,
      hasta: corte,
      precio: tarifa.precioDia,
    },
    {
      franja: 'NOCHE' as const,
      desde: corte,
      hasta: fin,
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
 * Valor de un turno que empieza a una hora: cada parte vale la tarifa de su
 * franja por la fracción del turno que ocupa. El total se redondea a céntimos
 * y el último tramo se ajusta para que el desglose sume exactamente el total.
 */
export function calcularValorDelTurno(
  tarifa: Tarifa,
  inicio: HoraDelDia,
  inicioDeLaNoche: HoraDelDia,
): ValorDelTurno {
  const partes = partesDelTurno(
    tarifa,
    inicio.minutos,
    inicioDeLaNoche.minutos,
  );
  return repartir(partes, tarifa.duracion.minutos);
}
