import type { HorarioSemanal } from './horario-semanal';

export const HORARIO_REPOSITORY = Symbol('HORARIO_REPOSITORY');

/** Un horario guardado, con quién lo guardó y cuándo empezó a regir. */
export interface VersionDeHorario {
  horario: HorarioSemanal;
  guardadoEn: Date;
  guardadoPor: string;
}

/** Puerto de las versiones del horario. Nunca se editan ni se borran: se agregan. */
export interface HorarioRepository {
  /** La versión más reciente, o nada si nunca se definió. */
  vigente(): Promise<VersionDeHorario | undefined>;

  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial(): Promise<VersionDeHorario[]>;

  /**
   * Agrega una versión solo si cambia algo, sin duplicar con guardados simultáneos. Anota
   * los códigos de las reservas que quedaron fuera y se respetan.
   */
  guardarSiCambia(
    horario: HorarioSemanal,
    guardadoPorId: number,
    guardadoEn: Date,
    reservasFueraDeHorario: string[],
  ): Promise<{ cambio: boolean; version: VersionDeHorario }>;
}
