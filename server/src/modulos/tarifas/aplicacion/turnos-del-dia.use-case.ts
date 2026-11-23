import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  esDiaDeLaSemana,
  generarTurnos,
  type HorarioRepository,
  type Rango,
} from '../../horario/api-horario';
import { TarifaSinDefinirError } from '../dominio/tarifa-sin-definir.error';
import type { TarifaRepository } from '../dominio/tarifa.repository';
import { calcularValorDelTurno, type Tramo } from '../dominio/valor-del-turno';
import { exigirTipoDeCancha } from './tipo-pedido';

export interface RangoEnTexto {
  desde: string;
  hasta: string;
}

export interface TurnoConPrecio extends RangoEnTexto {
  corto: boolean;
  total: string;
  tramos: Tramo[];
}

export type TurnosConsultados =
  | { estado: 'SIN_HORARIO' | 'CERRADO' }
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

/** Turnos válidos de un tipo de cancha en un día de la semana, cada uno con su precio. */
export class TurnosDelDiaUseCase {
  constructor(
    private readonly tarifas: Pick<TarifaRepository, 'vigente'>,
    private readonly horarios: Pick<HorarioRepository, 'vigente'>,
  ) {}

  async ejecutar(
    tipoPedido: string,
    diaPedido: string,
  ): Promise<TurnosConsultados> {
    const tipo = exigirTipoDeCancha(tipoPedido);
    if (!esDiaDeLaSemana(diaPedido)) {
      throw new ReglaInvalidaError({ dia: 'Elige un día de la semana.' });
    }
    const tarifa = (await this.tarifas.vigente(tipo))?.tarifa;
    if (!tarifa) throw new TarifaSinDefinirError(tipo);
    const horario = (await this.horarios.vigente())?.horario;
    if (!horario) return { estado: 'SIN_HORARIO' };
    const delDia = horario.del(diaPedido);
    if (!delDia) return { estado: 'CERRADO' };
    const noche = horario.inicioDeLaNocheDel(diaPedido);
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
}
