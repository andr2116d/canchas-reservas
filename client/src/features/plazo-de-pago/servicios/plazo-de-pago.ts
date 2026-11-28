/** Una versión guardada del plazo para pagar el adelanto. */
export interface VistaDelPlazo {
  minutos: number;
  guardadaEn: string;
  guardadaPor: string;
}

export interface PlazoConsultado {
  /** Falta si todavía no se guardó ningún plazo: rige el de por defecto. */
  vigente?: VistaDelPlazo;
  /** De la más reciente a la más antigua. */
  historial: VistaDelPlazo[];
  /** Minutos que rigen mientras no hay un plazo guardado. */
  porDefecto: number;
}
