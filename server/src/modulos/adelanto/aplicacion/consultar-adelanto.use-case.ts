import type { AdelantoRepository } from '../dominio/adelanto.repository';
import { aVista, type VistaDelAdelanto } from './vista-del-adelanto';

/** Lo que se propone al empezar, sin adelanto guardado (marco legal 9.1). */
const PROPUESTA = 50;

export interface AdelantoConsultado {
  /** Falta si todavía no se guardó ningún adelanto. */
  vigente?: VistaDelAdelanto;
  /** Versiones guardadas, de la más reciente a la más antigua. */
  historial: VistaDelAdelanto[];
  propuesta: number;
}

/** Adelanto mínimo vigente, sus versiones anteriores y la propuesta para empezar. */
export class ConsultarAdelantoUseCase {
  constructor(
    private readonly adelantos: Pick<AdelantoRepository, 'historial'>,
  ) {}

  async ejecutar(): Promise<AdelantoConsultado> {
    const historial = (await this.adelantos.historial()).map(aVista);
    return {
      ...(historial[0] && { vigente: historial[0] }),
      historial,
      propuesta: PROPUESTA,
    };
  }
}
