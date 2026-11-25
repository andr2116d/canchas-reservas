import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

/** Cómo se ve un turno de una cancha. Solo `DISPONIBLE` se puede elegir. */
export type EstadoDelTurno = "DISPONIBLE" | "PENDIENTE" | "OCUPADO" | "MANTENIMIENTO" | "SIN_LUZ" | "YA_EMPEZO";

export interface TurnoDelMapa {
  desde: string;
  hasta: string;
  corto: boolean;
  franja: "DIA" | "NOCHE" | "MIXTA";
  precio: string;
  /** Falta mientras administración no guarde el adelanto mínimo. */
  adelanto: string | null;
  inicio: string;
  canchas: { canchaId: number; estado: EstadoDelTurno }[];
}

export interface CanchaDelMapa {
  id: number;
  nombre: string;
  tieneIluminacion: boolean;
}

export type TipoDelMapa = { tipo: TipoDeCancha; canchas: CanchaDelMapa[] } & (
  | { estado: "SIN_TARIFA" }
  | { estado: "CON_TURNOS"; duracionDelTurnoHoras: number; inicioDeLaNoche: string; turnos: TurnoDelMapa[] }
);

export interface MapaDelDia {
  fecha: string;
  hoy: string;
  ultimaFecha: string;
  ahora: string;
  adelanto: number | null;
  local: "ABIERTO" | "CERRADO" | "SIN_HORARIO";
  tipos: TipoDelMapa[];
  proximoCambio: string | null;
}

/** El turno que se eligió: con esto se lo vuelve a encontrar después de cada actualización. */
export interface TurnoElegido {
  tipo: TipoDeCancha;
  desde: string;
  canchaId: number;
}
