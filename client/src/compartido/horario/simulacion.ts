import type { DiaDeLaSemana } from "./horario";

export interface Tramo {
  franja: "DIA" | "NOCHE";
  desde: string;
  hasta: string;
  monto: string;
}

export interface TurnoConPrecio {
  desde: string;
  hasta: string;
  /** Rato final del día ofrecido aunque no alcance para un turno completo. */
  corto: boolean;
  total: string;
  tramos: Tramo[];
}

export type TurnosDeUnDia =
  | { estado: "CERRADO" }
  | { estado: "ABIERTO"; duracionDelTurnoHoras: number; inicioDeLaNoche: string; turnos: TurnoConPrecio[]; sinTurno?: { desde: string; hasta: string } };

/** Turnos de cada día, por tipo de cancha, tal como los calcula el server. */
export interface Simulacion {
  tipos: Partial<Record<string, Record<DiaDeLaSemana, TurnosDeUnDia>>>;
}

/** Horario en edición, en el formato que guarda la API. */
export interface HorarioParaSimular {
  inicioDeLaNoche: string;
  dias: { dia: DiaDeLaSemana; abierto: boolean; abre?: string; cierra?: string; inicioDeLaNoche?: string }[];
}

/** Tarifa en edición de un tipo de cancha. */
export interface TarifaParaSimular {
  tipo: string;
  precioDia: string;
  precioNoche: string;
  duracionDelTurno: string;
  ofreceTurnoCorto: boolean;
}
