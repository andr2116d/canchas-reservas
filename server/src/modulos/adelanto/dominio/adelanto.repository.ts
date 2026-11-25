import type { PorcentajeDeAdelanto } from './porcentaje-de-adelanto.value-object';

export const ADELANTO_REPOSITORY = Symbol('ADELANTO_REPOSITORY');

/** Un adelanto guardado, con quién lo guardó y cuándo empezó a regir. */
export interface VersionDelAdelanto {
  porcentaje: PorcentajeDeAdelanto;
  guardadoEn: Date;
  guardadoPor: string;
}

/** Puerto de las versiones del adelanto mínimo. Nunca se editan ni se borran: se agregan. */
export interface AdelantoRepository {
  /** La versión más reciente, o nada si nunca se definió. */
  vigente(): Promise<VersionDelAdelanto | undefined>;

  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial(): Promise<VersionDelAdelanto[]>;

  /** Agrega una versión solo si cambia el porcentaje, sin duplicar con guardados simultáneos. */
  guardarSiCambia(
    porcentaje: PorcentajeDeAdelanto,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelAdelanto }>;
}
