import { api } from "@/lib/api";

export type EstadoTurno = "DISPONIBLE" | "PENDIENTE" | "OCUPADO" | "EN_MANTENIMIENTO";
export type MotivoTurno = "PASADO" | "SIN_TARIFA";
export type Franja = "DIA" | "NOCHE";
export type TamanoCancha = "FUTBOL_5" | "FUTBOL_7";

export type Turno = {
  horaInicio: string;
  horaFin: string;
  franja: Franja;
  estado: EstadoTurno;
  seleccionable: boolean;
  motivo?: MotivoTurno;
  valor?: number;
  adelanto?: number;
};

export type Cancha = {
  id: number;
  nombre: string;
  tamano: TamanoCancha;
  iluminacion: boolean;
  turnos: Turno[];
};

export type Disponibilidad = {
  fecha: string;
  abierto: boolean;
  canchas: Cancha[];
};

export const ETIQUETA_ESTADO: Record<EstadoTurno, string> = {
  DISPONIBLE: "Disponible",
  PENDIENTE: "Pendiente",
  OCUPADO: "Ocupado",
  EN_MANTENIMIENTO: "En mantenimiento",
};

export const ETIQUETA_MOTIVO: Record<MotivoTurno, string> = {
  PASADO: "Ya pasó",
  SIN_TARIFA: "Sin tarifa",
};

export const ETIQUETA_TAMANO: Record<TamanoCancha, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
};

export function obtenerDisponibilidad(fecha: string, canchaId?: number): Promise<Disponibilidad> {
  const parametros = new URLSearchParams({ fecha });
  if (canchaId !== undefined) parametros.set("canchaId", String(canchaId));
  return api<Disponibilidad>(`/disponibilidad?${parametros}`);
}
