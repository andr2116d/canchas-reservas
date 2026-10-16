import { api, ErrorApi } from "@/lib/api";

export type Franja = "DIA" | "NOCHE";

export type DiaHorario = {
  diaSemana: number;
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
};

export type Horario = {
  dias: DiaHorario[];
  inicioNoche: string;
};

export type TurnoPrevisto = {
  horaInicio: string;
  horaFin: string;
  franja: Franja;
};

export type ReservaFueraDeHorario = {
  id: number;
  cancha: string;
  fecha: string;
  horaInicio: string;
  jugador: string;
};

export type DatosGuardarHorario = {
  dias: DiaHorario[];
  inicioNoche: string;
  confirmar?: boolean;
};

export const ETIQUETA_DIA: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export function reservasFueraDeHorario(error: unknown): ReservaFueraDeHorario[] | null {
  if (!(error instanceof ErrorApi) || error.status !== 409) return null;
  const reservas = (error.datos as { reservasFueraDeHorario?: ReservaFueraDeHorario[] } | undefined)
    ?.reservasFueraDeHorario;
  return Array.isArray(reservas) ? reservas : null;
}

export function obtenerHorario(): Promise<Horario> {
  return api<Horario>("/horario");
}

export function guardarHorario(datos: DatosGuardarHorario): Promise<Horario> {
  return api<Horario>("/horario", { method: "PUT", body: datos });
}

export function obtenerVistaPrevia(fecha: string): Promise<TurnoPrevisto[]> {
  return api<TurnoPrevisto[]>(`/horario/vista-previa?${new URLSearchParams({ fecha })}`);
}