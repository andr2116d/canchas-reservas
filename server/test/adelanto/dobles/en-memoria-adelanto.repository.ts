import type {
  AdelantoRepository,
  VersionDelAdelanto,
} from '../../../src/modulos/adelanto/dominio/adelanto.repository';
import type { PorcentajeDeAdelanto } from '../../../src/modulos/adelanto/dominio/porcentaje-de-adelanto.value-object';

/** Versiones del adelanto mínimo en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaAdelantoRepository implements AdelantoRepository {
  readonly versiones: VersionDelAdelanto[] = [];

  vigente(): Promise<VersionDelAdelanto | undefined> {
    return Promise.resolve(this.versiones.at(-1));
  }

  historial(): Promise<VersionDelAdelanto[]> {
    return Promise.resolve([...this.versiones].reverse());
  }

  async guardarSiCambia(
    porcentaje: PorcentajeDeAdelanto,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelAdelanto }> {
    const actual = await this.vigente();
    if (actual?.porcentaje.igualA(porcentaje)) {
      return { cambio: false, version: actual };
    }
    const version = {
      porcentaje,
      guardadoEn,
      guardadoPor: `Administración ${guardadoPorId}`,
    };
    this.versiones.push(version);
    return { cambio: true, version };
  }
}
