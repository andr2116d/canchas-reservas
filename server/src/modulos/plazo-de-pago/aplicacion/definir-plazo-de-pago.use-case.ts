import type { Reloj } from '../../../compartido/aplicacion/reloj.port';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { MinutosParaPagar } from '../dominio/minutos-para-pagar.value-object';
import type { PlazoDePagoRepository } from '../dominio/plazo-de-pago.repository';
import { aVista, type VistaDelPlazo } from './vista-del-plazo';

export interface DatosDelPlazo {
  minutos: string;
}

/**
 * Define cuánto tiempo hay para pagar el adelanto. Rige para las reservas que se creen
 * después: cada una guarda su vencimiento. Guardar los mismos minutos no es un cambio.
 */
export class DefinirPlazoDePagoUseCase {
  constructor(
    private readonly plazos: Pick<PlazoDePagoRepository, 'guardarSiCambia'>,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    datos: DatosDelPlazo,
    administradorId: number,
  ): Promise<{ cambio: boolean; vigente: VistaDelPlazo }> {
    const { minutos } = validarCampos({
      minutos: () => MinutosParaPagar.crear(datos.minutos),
    });
    const { cambio, version } = await this.plazos.guardarSiCambia(
      minutos,
      administradorId,
      this.reloj.ahora(),
    );
    return { cambio, vigente: aVista(version) };
  }
}
