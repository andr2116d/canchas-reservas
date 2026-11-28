import type {
  HorarioRepository,
  VersionDeHorario,
} from '../../../src/modulos/horario/dominio/horario.repository';
import type { HorarioSemanal } from '../../../src/modulos/horario/dominio/horario-semanal';

/** Versiones del horario en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaHorarioRepository implements HorarioRepository {
  readonly versiones: VersionDeHorario[] = [];
  /** Las reservas que quedaron fuera de cada versión guardada, en el mismo orden. */
  readonly fueraDeHorario: string[][] = [];

  vigente(): Promise<VersionDeHorario | undefined> {
    return Promise.resolve(this.versiones.at(-1));
  }

  historial(): Promise<VersionDeHorario[]> {
    return Promise.resolve([...this.versiones].reverse());
  }

  async guardarSiCambia(
    horario: HorarioSemanal,
    guardadoPorId: number,
    guardadoEn: Date,
    reservasFueraDeHorario: string[] = [],
  ): Promise<{ cambio: boolean; version: VersionDeHorario }> {
    const actual = await this.vigente();
    if (actual?.horario.igualA(horario))
      return { cambio: false, version: actual };
    const version = {
      horario,
      guardadoEn,
      guardadoPor: `Administración ${guardadoPorId}`,
    };
    this.versiones.push(version);
    this.fueraDeHorario.push(reservasFueraDeHorario);
    return { cambio: true, version };
  }
}
