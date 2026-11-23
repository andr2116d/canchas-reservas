import type { RangoDeCancelacion } from '../dominio/regla-de-cancelacion';
import type { ReglaDeCancelacionRepository } from '../dominio/regla-de-cancelacion.repository';
import { aVista, type VistaDeLaRegla } from './vista-de-la-regla';

/** Lo que se propone al empezar, sin regla guardada: el ejemplo del negocio. */
const PROPUESTA: RangoDeCancelacion[] = [
  { desdeHoras: 2, porcentaje: 100, ofreceCredito: true },
  { desdeHoras: 1, porcentaje: 50, ofreceCredito: false },
  { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
];

export interface ReglaConsultada {
  /** Falta si todavía no se guardó ninguna regla. */
  vigente?: VistaDeLaRegla;
  /** Versiones guardadas, de la más reciente a la más antigua: muestran los valores anteriores. */
  historial: VistaDeLaRegla[];
  propuesta: RangoDeCancelacion[];
}

/** Regla de cancelación vigente, sus versiones anteriores y la propuesta para empezar. */
export class ConsultarReglaDeCancelacionUseCase {
  constructor(
    private readonly reglas: Pick<ReglaDeCancelacionRepository, 'historial'>,
  ) {}

  async ejecutar(): Promise<ReglaConsultada> {
    const historial = (await this.reglas.historial()).map(aVista);
    return { vigente: historial[0], historial, propuesta: PROPUESTA };
  }
}
