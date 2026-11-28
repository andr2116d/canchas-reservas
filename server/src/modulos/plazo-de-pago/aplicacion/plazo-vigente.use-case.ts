import { MinutosParaPagar } from '../dominio/minutos-para-pagar.value-object';
import {
  MINUTOS_POR_DEFECTO,
  type PlazoDePagoRepository,
} from '../dominio/plazo-de-pago.repository';

/** El plazo que rige para una reserva nueva: el último guardado o, si no hay, el de por defecto. */
export class PlazoVigenteUseCase {
  constructor(
    private readonly plazos: Pick<PlazoDePagoRepository, 'vigente'>,
  ) {}

  async ejecutar(): Promise<MinutosParaPagar> {
    const vigente = await this.plazos.vigente();
    return vigente?.minutos ?? MinutosParaPagar.restaurar(MINUTOS_POR_DEFECTO);
  }
}
