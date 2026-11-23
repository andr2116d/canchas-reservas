import type { Tarifa } from '../../src/modulos/tarifas/dominio/tarifa';
import type {
  TarifaRepository,
  VersionDeTarifa,
} from '../../src/modulos/tarifas/dominio/tarifa.repository';
import type { TipoDeCancha } from '../../src/modulos/tarifas/dominio/tipo-de-cancha';

/** Versiones de tarifas en memoria para probar casos de uso sin base de datos. */
export class EnMemoriaTarifaRepository implements TarifaRepository {
  readonly versiones: VersionDeTarifa[] = [];

  vigente(tipo: TipoDeCancha): Promise<VersionDeTarifa | undefined> {
    return Promise.resolve(
      this.versiones.filter((v) => v.tarifa.tipo === tipo).at(-1),
    );
  }

  historial(tipo: TipoDeCancha): Promise<VersionDeTarifa[]> {
    return Promise.resolve(
      this.versiones.filter((v) => v.tarifa.tipo === tipo).reverse(),
    );
  }

  async guardarSiCambia(
    tarifa: Tarifa,
    guardadaPorId: number,
    guardadaEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDeTarifa }> {
    const actual = await this.vigente(tarifa.tipo);
    if (actual?.tarifa.igualA(tarifa))
      return { cambio: false, version: actual };
    const version = {
      tarifa,
      guardadaEn,
      guardadaPor: `Administración ${guardadaPorId}`,
    };
    this.versiones.push(version);
    return { cambio: true, version };
  }
}
