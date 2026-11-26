import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import {
  type DatosDelRango,
  ReglaDeCancelacion,
} from '../dominio/regla-de-cancelacion';
import type { ReglaDeCancelacionRepository } from '../dominio/regla-de-cancelacion.repository';
import { aVista, type VistaDeLaRegla } from './vista-de-la-regla';

export interface DatosDeLaRegla {
  rangos: DatosDelRango[];
}

/**
 * Define la regla de cancelación del local. Rige para las reservas que se creen
 * después; las ya creadas conservan la suya. Guardar los mismos valores no es un cambio.
 */
export class DefinirReglaDeCancelacionUseCase {
  constructor(
    private readonly reglas: Pick<
      ReglaDeCancelacionRepository,
      'guardarSiCambia'
    >,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDeLaRegla,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDeLaRegla }> {
    const regla = ReglaDeCancelacion.crear(datos.rangos);
    const { cambio, version } = await this.reglas.guardarSiCambia(
      regla,
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
