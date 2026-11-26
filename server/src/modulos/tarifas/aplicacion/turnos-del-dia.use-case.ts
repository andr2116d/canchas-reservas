import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import {
  esDiaDeLaSemana,
  type HorarioRepository,
} from '../../horario/api-horario';
import { TarifaSinDefinirError } from '../dominio/tarifa-sin-definir.error';
import type { TarifaRepository } from '../dominio/tarifa.repository';
import { exigirTipoDeCancha } from './tipo-pedido';
import { turnosConPrecio, type TurnosDeUnDia } from './turnos-con-precio';

export type { TurnoConPrecio } from './turnos-con-precio';

export type TurnosConsultados = { estado: 'SIN_HORARIO' } | TurnosDeUnDia;

/** Turnos válidos de un tipo de cancha en un día de la semana, con el horario y la tarifa guardados. */
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
    return turnosConPrecio(horario, diaPedido, tarifa);
  }
}
