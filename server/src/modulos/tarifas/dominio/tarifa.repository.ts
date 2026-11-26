import type { Tarifa } from './tarifa';
import type { TipoDeCancha } from '../../../compartido/dominio/tipo-de-cancha';

export const TARIFA_REPOSITORY = Symbol('TARIFA_REPOSITORY');

/** Una tarifa guardada, con quién la guardó y cuándo empezó a regir. */
export interface VersionDeTarifa {
  tarifa: Tarifa;
  guardadaEn: Date;
  guardadaPor: string;
}

/** Puerto de las versiones de tarifas. Nunca se editan ni se borran: se agregan. */
export interface TarifaRepository {
  /** La versión más reciente del tipo, o nada si nunca se definió. */
  vigente(tipo: TipoDeCancha): Promise<VersionDeTarifa | undefined>;

  /** Versiones del tipo, de la más reciente a la más antigua. */
  historial(tipo: TipoDeCancha): Promise<VersionDeTarifa[]>;

  /**
   * Agrega una versión solo si cambia algo respecto de la vigente, en una
   * operación que dos guardados al mismo tiempo no pueden duplicar.
   */
  guardarSiCambia(
    tarifa: Tarifa,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeTarifa }>;
}
