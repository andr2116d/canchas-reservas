import type { ReglaDeCancelacion } from '../../../src/modulos/cancelacion/dominio/regla-de-cancelacion';
import type {
  ReglaDeCancelacionRepository,
  VersionDeLaRegla,
} from '../../../src/modulos/cancelacion/dominio/regla-de-cancelacion.repository';

/** Versiones de la regla de cancelación en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaReglaDeCancelacionRepository implements ReglaDeCancelacionRepository {
  readonly versiones: VersionDeLaRegla[] = [];

  vigente(): Promise<VersionDeLaRegla | undefined> {
    return Promise.resolve(this.versiones.at(-1));
  }

  historial(): Promise<VersionDeLaRegla[]> {
    return Promise.resolve([...this.versiones].reverse());
  }

  async guardarSiCambia(
    regla: ReglaDeCancelacion,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeLaRegla }> {
    const actual = await this.vigente();
    if (actual?.regla.igualA(regla)) return { cambio: false, version: actual };
    const version = {
      regla,
      guardadaEn,
      guardadaPor: `Administración ${guardadaPorId}`,
    };
    this.versiones.push(version);
    return { cambio: true, version };
  }
}
