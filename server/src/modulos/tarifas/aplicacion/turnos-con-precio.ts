import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import {
  type DiaDeLaSemana,
  generarTurnos,
  type HorarioSemanal,
  type Rango,
} from '../../horario/api-horario';
import type { Tarifa } from '../dominio/tarifa';
import { calcularValorDelTurno, type Tramo } from '../dominio/valor-del-turno';

export interface RangoEnTexto {
  desde: string;
  hasta: string;
}

export interface TurnoConPrecio extends RangoEnTexto {
  corto: boolean;
  total: string;
  tramos: Tramo[];
}

export type TurnosDeUnDia =
  | { estado: 'CERRADO' }
  | {
      estado: 'ABIERTO';
      duracionDelTurnoHoras: number;
      inicioDeLaNoche: string;
      turnos: TurnoConPrecio[];
      sinTurno?: RangoEnTexto;
    };

const enTexto = ({ desde, hasta }: Rango): RangoEnTexto => ({
  desde: HoraDelDia.desdeMinutos(desde).texto,
  hasta: HoraDelDia.desdeMinutos(hasta).texto,
});

/**
 * Turnos de un día con el horario y la tarifa dados, cada uno con su precio.
 * Es el único cálculo de turnos: lo usan la consulta, la vista previa y, más
 * adelante, la reserva.
 */
export function turnosConPrecio(
  horario: HorarioSemanal,
  dia: DiaDeLaSemana,
  tarifa: Tarifa,
): TurnosDeUnDia {
  const delDia = horario.del(dia);
  if (!delDia) return { estado: 'CERRADO' };
  const noche = horario.inicioDeLaNocheDel(dia);
  const { turnos, sinTurno } = generarTurnos(
    delDia,
    tarifa.duracion.minutos,
    tarifa.ofreceTurnoCorto,
  );
  return {
    estado: 'ABIERTO',
    duracionDelTurnoHoras: tarifa.duracion.horas,
    inicioDeLaNoche: noche.texto,
    turnos: turnos.map((turno) => {
      const valor = calcularValorDelTurno(tarifa, turno, noche);
      return {
        ...enTexto(turno),
        corto: turno.corto,
        total: valor.total.enSoles(),
        tramos: valor.tramos,
      };
    }),
    ...(sinTurno && { sinTurno: enTexto(sinTurno) }),
  };
}
