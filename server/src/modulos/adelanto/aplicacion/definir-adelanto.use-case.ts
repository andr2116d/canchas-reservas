import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import type { AdelantoRepository } from '../dominio/adelanto.repository';
import { PorcentajeDeAdelanto } from '../dominio/porcentaje-de-adelanto.value-object';
import { aVista, type VistaDelAdelanto } from './vista-del-adelanto';

export interface DatosDelAdelanto {
  porcentaje: string;
}

/**
 * Define el adelanto mínimo del local. Rige para las reservas que se creen
 * después; las ya creadas conservan el suyo. Guardar el mismo valor no es un cambio.
 */
export class DefinirAdelantoUseCase {
  constructor(
    private readonly adelantos: Pick<AdelantoRepository, 'guardarSiCambia'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDelAdelanto,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDelAdelanto }> {
    const { porcentaje } = validarCampos({
      porcentaje: () => PorcentajeDeAdelanto.crear(datos.porcentaje),
    });
    const { cambio, version } = await this.adelantos.guardarSiCambia(
      porcentaje,
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
