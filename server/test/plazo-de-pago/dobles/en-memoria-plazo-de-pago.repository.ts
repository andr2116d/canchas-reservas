import type { MinutosParaPagar } from '../../../src/modulos/plazo-de-pago/dominio/minutos-para-pagar.value-object';
import type {
  PlazoDePagoRepository,
  VersionDelPlazo,
} from '../../../src/modulos/plazo-de-pago/dominio/plazo-de-pago.repository';

/** Versiones del plazo para pagar en memoria, para probar casos de uso sin base de datos. */
export class EnMemoriaPlazoDePagoRepository implements PlazoDePagoRepository {
  readonly versiones: VersionDelPlazo[] = [];

  vigente(): Promise<VersionDelPlazo | undefined> {
    return Promise.resolve(this.versiones.at(-1));
  }

  historial(): Promise<VersionDelPlazo[]> {
    return Promise.resolve([...this.versiones].reverse());
  }

  async guardarSiCambia(
    minutos: MinutosParaPagar,
    guardadoPorId: number,
    guardadoEn: Date,
  ): Promise<{ cambio: boolean; version: VersionDelPlazo }> {
    const actual = await this.vigente();
    if (actual?.minutos.igualA(minutos))
      return { cambio: false, version: actual };
    const version = {
      minutos,
      guardadoEn,
      guardadoPor: `Administración ${guardadoPorId}`,
    };
    this.versiones.push(version);
    return { cambio: true, version };
  }
}
