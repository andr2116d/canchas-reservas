/** Un rango guardado: desde cuántas horas antes rige, cuánto del anticipo devuelve y si ofrece crédito. */
export interface Rango {
  desdeHoras: number;
  porcentaje: number;
  ofreceCredito: boolean;
}

export interface VistaDeLaRegla {
  rangos: Rango[];
  guardadaEn: string;
  guardadaPor: string;
}

/** La regla tal como la devuelve la API: la vigente, sus versiones y la propuesta para empezar. */
export interface ReglaConsultada {
  vigente?: VistaDeLaRegla;
  historial: VistaDeLaRegla[];
  propuesta: Rango[];
}

export type FormaDeDevolucion = "DINERO" | "CREDITO";

/** Lo que recibiría el jugador, según el server. */
export interface Compensacion {
  desdeHoras: number;
  porcentaje: number;
  formas: FormaDeDevolucion[];
  devolucionDelAnticipo: string;
  retenido: string;
  excedente: string;
  totalADevolver: string;
}
