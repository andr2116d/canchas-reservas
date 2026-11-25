/** Una versión guardada del adelanto mínimo. */
export interface VistaDelAdelanto {
  porcentaje: number;
  guardadaEn: string;
  guardadaPor: string;
}

export interface AdelantoConsultado {
  /** Falta si todavía no se guardó ningún adelanto. */
  vigente?: VistaDelAdelanto;
  /** De la más reciente a la más antigua. */
  historial: VistaDelAdelanto[];
  /** Porcentaje que se propone mientras no hay uno guardado. */
  propuesta: number;
}
