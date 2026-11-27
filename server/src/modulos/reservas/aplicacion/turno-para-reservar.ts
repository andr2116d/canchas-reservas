import type {
  ReglaDeCancelacionRepository,
  VersionDeLaRegla,
} from '../../cancelacion/api-cancelacion';
import { ReservasSinConfigurarError } from '../dominio/reservas-sin-configurar.error';
import { TurnoNoDisponibleError } from '../dominio/turno-no-disponible.error';
import type {
  TurnoDelLocal,
  TurnoPedido,
  TurnosDelLocal,
} from './turnos-del-local.port';

export interface DependenciasDelTurno {
  turnos: TurnosDelLocal;
  reglas: Pick<ReglaDeCancelacionRepository, 'vigente'>;
}

/** Un turno libre que ya tiene definidos su adelanto y la regla de cancelación. */
export interface TurnoParaReservar {
  turno: TurnoDelLocal & { adelanto: NonNullable<TurnoDelLocal['adelanto']> };
  regla: VersionDeLaRegla;
}

/** El turno pedido, si se puede separar: libre y con todo lo que se muestra antes de confirmar. */
export async function turnoParaReservar(
  de: DependenciasDelTurno,
  pedido: TurnoPedido,
): Promise<TurnoParaReservar> {
  const [turno, regla] = await Promise.all([
    de.turnos.buscar(pedido),
    de.reglas.vigente(),
  ]);
  if (!turno?.libre) throw new TurnoNoDisponibleError();
  if (!turno.adelanto) throw new ReservasSinConfigurarError('el adelanto');
  if (!regla) throw new ReservasSinConfigurarError('la regla de cancelación');
  return { turno: { ...turno, adelanto: turno.adelanto }, regla };
}
