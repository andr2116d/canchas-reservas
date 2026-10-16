import { api, ErrorApi } from "@/lib/api";

export type TamanoCancha = "FUTBOL_5" | "FUTBOL_7";
export type EstadoCancha = "OPERATIVA" | "EN_MANTENIMIENTO";
export type Franja = "DIA" | "NOCHE";

export type Cancha = {
  id: number;
  nombre: string;
  tamano: TamanoCancha;
  iluminacion: boolean;
  estado: EstadoCancha;
  activa: boolean;
  tieneTarifas: boolean;
  franjasSinTarifa: Franja[];
};

export type ReservaFutura = {
  id: number;
  codigo: string;
  fecha: string;
  horaInicio: string;
  cliente: string;
};

export type DatosCrearCancha = Pick<Cancha, "nombre" | "tamano" | "iluminacion">;
export type DatosEditarCancha = DatosCrearCancha & Pick<Cancha, "estado">;

export const ETIQUETA_TAMANO: Record<TamanoCancha, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
};

export const ETIQUETA_ESTADO: Record<EstadoCancha, string> = {
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En mantenimiento",
};

export function avisoSinTarifa(franjas: Franja[]): string | null {
  if (franjas.length === 0) return null;
  if (franjas.length > 1) return "Sin tarifa";
  return franjas[0] === "DIA" ? "Sin tarifa de día" : "Sin tarifa de noche";
}

export function reservasDelConflicto(error: unknown): ReservaFutura[] | null {
  if (!(error instanceof ErrorApi) || error.status !== 409) return null;
  const reservas = (error.datos as { reservasFuturas?: ReservaFutura[] } | undefined)?.reservasFuturas;
  return Array.isArray(reservas) ? reservas : null;
}

export function listarCanchas(): Promise<Cancha[]> {
  return api<Cancha[]>("/canchas");
}

export function crearCancha(datos: DatosCrearCancha): Promise<Cancha> {
  return api<Cancha>("/canchas", { method: "POST", body: datos });
}

export function editarCancha(id: number, datos: DatosEditarCancha): Promise<Cancha> {
  return api<Cancha>(`/canchas/${id}`, { method: "PATCH", body: datos });
}

export function cambiarActivaCancha(id: number, activa: boolean, confirmar?: boolean): Promise<Cancha> {
  return api<Cancha>(`/canchas/${id}/activa`, {
    method: "PATCH",
    body: confirmar === undefined ? { activa } : { activa, confirmar },
  });
}

export function eliminarCancha(id: number): Promise<void> {
  return api<void>(`/canchas/${id}`, { method: "DELETE" });
}
