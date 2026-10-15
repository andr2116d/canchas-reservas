import { api } from "@/lib/api";

export type Adicional = {
  id: number;
  nombre: string;
  precio: number;
  activo: boolean;
};

export type FiltroAdicional = "activos" | "inactivos";

export type DatosAdicional = Pick<Adicional, "nombre" | "precio">;

export function listarAdicionales(filtro?: FiltroAdicional): Promise<Adicional[]> {
  const activo = filtro === "activos" ? true : filtro === "inactivos" ? false : undefined;
  const query = activo === undefined ? "" : `?${new URLSearchParams({ activo: String(activo) })}`;
  return api<Adicional[]>(`/adicionales${query}`);
}

export function crearAdicional(datos: DatosAdicional): Promise<Adicional> {
  return api<Adicional>("/adicionales", { method: "POST", body: datos });
}

export function editarAdicional(id: number, datos: DatosAdicional): Promise<Adicional> {
  return api<Adicional>(`/adicionales/${id}`, { method: "PATCH", body: datos });
}

export function cambiarActivoAdicional(id: number, activo: boolean): Promise<Adicional> {
  return api<Adicional>(`/adicionales/${id}/estado`, { method: "PATCH", body: { activo } });
}

export function eliminarAdicional(id: number): Promise<void> {
  return api<void>(`/adicionales/${id}`, { method: "DELETE" });
}