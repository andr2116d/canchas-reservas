import {
  MINUTOS_POR_DEFECTO,
  type PlazoDePagoRepository,
} from '../dominio/plazo-de-pago.repository';
import { aVista, type VistaDelPlazo } from './vista-del-plazo';

export interface PlazoConsultado {
  /** Falta si todavía no se guardó ningún plazo: rige el de por defecto. */
  vigente?: VistaDelPlazo;
  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial: VistaDelPlazo[];
  porDefecto: number;
}

/** Plazo para pagar vigente, sus versiones anteriores y el que rige si no hay ninguno. */
export class ConsultarPlazoDePagoUseCase {
  constructor(
    private readonly plazos: Pick<PlazoDePagoRepository, 'historial'>,
  ) {}

  async ejecutar(): Promise<PlazoConsultado> {
    const historial = (await this.plazos.historial()).map(aVista);
    return {
      ...(historial[0] && { vigente: historial[0] }),
      historial,
      porDefecto: MINUTOS_POR_DEFECTO,
    };
  }
}
