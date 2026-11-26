import {
  type ErroresPorCampo,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import {
  construirHorario,
  DIAS_DE_LA_SEMANA,
  type DatosDelHorario,
  type DiaDeLaSemana,
} from '../../horario/api-horario';
import type { Tarifa } from '../dominio/tarifa';
import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';
import { construirTarifa, type DatosDeTarifa } from './construir-tarifa';
import { exigirTipoDeCancha } from './tipo-pedido';
import { turnosConPrecio, type TurnosDeUnDia } from './turnos-con-precio';

/** Horario y tarifas tal como se están editando, todavía sin guardar. */
export interface DatosDeSimulacion {
  horario: DatosDelHorario;
  tarifas: (DatosDeTarifa & { tipo: string })[];
}

export type SemanaSimulada = Record<DiaDeLaSemana, TurnosDeUnDia>;

/** Ejecuta `construir` y, si falla, guarda sus errores con un prefijo para ubicarlos. */
function intentar<T>(
  errores: ErroresPorCampo,
  prefijo: string,
  construir: () => T,
): T | undefined {
  try {
    return construir();
  } catch (error) {
    if (!(error instanceof ReglaInvalidaError)) throw error;
    for (const [campo, mensaje] of Object.entries(error.errores)) {
      errores[`${prefijo}.${campo}`] = mensaje;
    }
  }
}

/**
 * Turnos de cada día de la semana con el horario y las tarifas en edición, sin
 * guardar nada. La vista previa usa el mismo cálculo que la consulta y la reserva.
 */
export class SimularTurnosUseCase {
  async ejecutar(
    datos: DatosDeSimulacion,
  ): Promise<{ tipos: Partial<Record<TipoDeCancha, SemanaSimulada>> }> {
    const errores: ErroresPorCampo = {};
    const horario = intentar(errores, 'horario', () =>
      construirHorario(datos.horario),
    );
    const tarifas = datos.tarifas.flatMap((tarifa): Tarifa[] => {
      const tipo = exigirTipoDeCancha(tarifa.tipo);
      const construida = intentar(errores, tipo, () =>
        construirTarifa(tipo, tarifa),
      );
      return construida ? [construida] : [];
    });
    if (!horario || Object.keys(errores).length > 0)
      throw new ReglaInvalidaError(errores);
    const tipos = Object.fromEntries(
      tarifas.map((tarifa) => [
        tarifa.tipo,
        Object.fromEntries(
          DIAS_DE_LA_SEMANA.map((dia) => [
            dia,
            turnosConPrecio(horario, dia, tarifa),
          ]),
        ),
      ]),
    );
    return { tipos };
  }
}
