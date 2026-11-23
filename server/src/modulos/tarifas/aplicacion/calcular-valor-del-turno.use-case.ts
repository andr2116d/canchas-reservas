import { ReglaInvalidaError } from '../../../compartido/dominio/dominio.error';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { HoraDelDia } from '../../../compartido/dominio/hora-del-dia.value-object';
import { TarifaSinDefinirError } from '../dominio/tarifa-sin-definir.error';
import type { TarifaRepository } from '../dominio/tarifa.repository';
import { calcularValorDelTurno, type Tramo } from '../dominio/valor-del-turno';
import type { HorarioDeFranjas } from './horario-de-franjas.port';
import { exigirTipoDeCancha } from './tipo-pedido';

export interface ValorCalculado {
  total: string;
  duracionDelTurnoHoras: number;
  tramos: Tramo[];
}

/** Valor del turno de un tipo de cancha que empieza a una hora, con su desglose por franja. */
export class CalcularValorDelTurnoUseCase {
  constructor(
    private readonly tarifas: Pick<TarifaRepository, 'vigente'>,
    private readonly horario: HorarioDeFranjas,
  ) {}

  async ejecutar(
    tipoPedido: string,
    inicioPedido: string,
  ): Promise<ValorCalculado> {
    const tipo = exigirTipoDeCancha(tipoPedido);
    const { inicio } = validarCampos({
      inicio: () => HoraDelDia.crear(inicioPedido),
    });
    const version = await this.tarifas.vigente(tipo);
    if (!version) throw new TarifaSinDefinirError(tipo);
    try {
      const valor = calcularValorDelTurno(
        version.tarifa,
        inicio,
        await this.horario.inicioDeLaNoche(),
      );
      return {
        total: valor.total.enSoles(),
        duracionDelTurnoHoras: version.tarifa.duracion.horas,
        tramos: valor.tramos,
      };
    } catch (error) {
      if (!(error instanceof ValorInvalidoError)) throw error;
      throw new ReglaInvalidaError({ inicio: error.message });
    }
  }
}
