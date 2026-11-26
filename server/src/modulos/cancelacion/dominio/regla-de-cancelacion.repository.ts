import type { ReglaDeCancelacion } from './regla-de-cancelacion';

export const REGLA_DE_CANCELACION_REPOSITORY = Symbol(
  'REGLA_DE_CANCELACION_REPOSITORY',
);

/** Una regla guardada, con quién la guardó y cuándo empezó a regir. */
export interface VersionDeLaRegla {
  regla: ReglaDeCancelacion;
  guardadaEn: Date;
  guardadaPor: string;
}

/** Puerto de las versiones de la regla de cancelación. Nunca se editan ni se borran: se agregan. */
export interface ReglaDeCancelacionRepository {
  /** La versión más reciente, o nada si nunca se definió. */
  vigente(): Promise<VersionDeLaRegla | undefined>;

  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial(): Promise<VersionDeLaRegla[]>;

  /** Agrega una versión solo si cambia algo, sin duplicar con guardados simultáneos. */
  guardarSiCambia(
    regla: ReglaDeCancelacion,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeLaRegla }>;
}
